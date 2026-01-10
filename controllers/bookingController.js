const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const Property = require("../models/Property");
const { shouldActivateBooking } = require("../utils/bookingUtils")
const user = require("../models/user");
const { getIO } = require("../socket/socket");

////////////////////////
// Create a new booking
////////////////////////
exports.createBooking = async(req, res) => {
    try{
        const { property, checkInDate, checkOutDate, message } = req.body;

        const apartment = await Property.findById(property);
        if (!apartment || apartment.propertyType !== "serviced") {
            return res.status(400). json({ error: "invalid of non-serviced apartment selected" })
        };

        // Parse dates as UTC (prevents timezone shifting)
        const start = new Date(`${checkInDate}T00:00:00.000Z`);
        const end = new Date(`${checkOutDate}T00:00:00.000Z`);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" })
        }

        if (end <= start) {
            return res.status(400).json({ message: "check-out date must be after check-in date" })
        }

        // Calculate stay duration
        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        const days = Math.ceil((end - start) / MS_PER_DAY);

        if (days < 1) {
            return res.status(400).json({ message: "booking must be at least one day" })
        }

        // Check for date conflicts
        const conflictingBooking = await Booking.findOne({
            property,
            bookingStatus: { $in: ["pending", "approved", "active"] },
            checkInDate: { $lt: end },
            checkOutDate: { $gt: start }
        });

        if (conflictingBooking) {
            return res.status(409).json({ message: "Apartment is already been booking for selected dates" })
        }

        const totalPrice = days * apartment.dailyRate;

        const booking = new Booking({
            property,
            guest: req.user._id,
            guestName: req.user.name,
            guestEmail: req.user.email,
            guestPhone: req.user.phone,
            checkInDate: start,
            checkOutDate: end,
            totalPrice,
            message,
            bookingStatus: "pending",
            paymentStatus: "unpaid"
        });

        const saved = await booking.save();

        // Agent Notification
        const agentId = apartment.postedBy;
        const io = getIO();
        
        const notification = await Notification.create({
            user: agentId,
            type: "booking",
            title: "New Booking Request",
            body: `${req.user.name} requested to book your apartment.`,
        });

        // Real-time push to agent
        io.to(agentId.toString().emit("notification", {
            id: notification._id,
            type: "booking",
            title: notification.title,
            body: notification.body
        }))

        res.status(201).json(saved); 
    }
    catch (err) {
        res.status(500).json({ err: err.message });
    }
    
}

/////////////////////
// Approve a booking
////////////////////
exports.approveBooking = async (req, res) => {
    try{
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        //Only agents who own the property can approve
        if (booking.property.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to approve this booking" });
        }

        if (booking.bookingStatus !== "pending") {
            return res.status(400).json({ message: `Booking cannot be approved. Current status: ${booking.bookingStatus}`  });
        }

        booking.bookingStatus = "approved";
        await booking.save()

        // Guest Notification
        const io = getIO();

        const notification = await Notification.create({
            user: booking.guest,
            type: "booking",
            title: "Booking Approved",
            body: "Your booking has been approved. Please upload payment receipt to continue"
        });

        // Real-time push to guest
        io.to(booking.guest.toString().emit("notification", {
            id: notification._id,
            title: notification.title,
            body: notification.body

        }))

        res.status(200).json({
            message: "Booking approved successfully",
            booking
        })

    }
    catch (err) {
        console.error(err);
        res.status(200).json({
            message: "Failed to approve building",
            error: err.message
        })
    }
}

////////////////////
// Reject a booking
////////////////////
exports.rejectBooking = async (req, res) => {
    try{
        const { bookingId } = req.params;
        const { reason } = req.body;

        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.property.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to reject this booking" });
        }

        if (booking.bookingStatus !== "pending") {
            return res.status(400).json({ message: `Booking cannot be rejected. Current Status: ${booking.bookingStatus}` });
        }

        booking.bookingStatus = "rejected";
        booking.rejectionReason = reason || "No reason provided";

        await booking.save();
        
        // Guest Notification
        const io = getIO();

        const notification = await Notification.create({
            user: booking.guest,
            type: "booking",
            title: "Booking Rejected",
            body: `Your booking request was rejected. Reason: ${booking.rejectionReason}`,
        });

        // Real-time push to guest
        io.to(booking.guest.toString()).emit("notification", {
            id: notification._id,
            type: "booking",
            title: notification.title,
            body: notification.body,
        });

        res.status(200).json({ 
            message: "Booking rejected successfully",
            booking
        })
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to reject booking",
            error: err.message
        });
    }
}

/////////////////////////
// Upload payment receipt
/////////////////////////
exports.uploadPaymentReceipt = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        // Only booking owner can upload receipt
        if (booking.guest.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to upload receipt for this booking"
            });
        }

        if (booking.bookingStatus !== "approved") {
            return res.status(400).json({
                message: "Receipt can only be uploaded after booking approval"
            });
        }

        if (booking.paymentStatus === "receiptUploaded") {
            return res.status(400).json({
                message: "Receipt already uploaded"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Payment receipt file is required"
            });
        }

        if (["expired", "completed", "rejected"].includes(booking.bookingStatus)) {
            return res.status(400).json({
                message: `Cannot upload receipt for a ${booking.bookingStatus} booking`
            });
        }

        if (booking.paymentStatus === "verified") {
            return res.status(400).json({ message: "Receipt already verified" });
        }

        booking.paymentReceipt = req.file.path;
        booking.paymentStatus = "receiptUploaded";
        booking.receiptUploadedAt = new Date();

        await booking.save();

        // Agent Notification
        const agentId = booking.property.postedBy;
        const io = getIO();

        const notification = await Notification.create({
            user: agentId,
            type: "booking",
            title: "Payment Receipt Uploaded",
            body: `${req.user.name} uploaded a payment receipt for a booking.`,
        });

        // Real-time push to agent
        io.to(agentId.toString()).emit("notification", {
            id: notification._id,
            type: "booking",
            title: notification.title,
            body: notification.body,
        });


        res.status(200).json({
            message: "Payment receipt uploaded successfully",
            booking
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to upload receipt",
            error: err.message
        });
    }
};

/////////////////////////
// Verify payment receipt
/////////////////////////
exports.verifyPaymentReceipt = async (req, res) => {
    try{
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        const isAgentOwner = booking.property.postedBy.toString() === req.user._id.toString();

        if (!isAgentOwner && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to verify this receipt" });
        }

        if (booking.paymentStatus !== "receiptUploaded") {
            return res.status(400).json({ message: `Cannot verify receipt. Current Status: ${booking.paymentStatus}` });
        }

        booking.paymentStatus = "verified";
        booking.receiptVerifiedAt = new Date();
        
        //Auto activation
        if (shouldActivateBooking(booking.checkInDate)) {
            booking.bookingStatus = "active";
        }

        await booking.save();

        // Guest Notification
        const io = getIO();

        const notification = await Notification.create({
            user: booking.guest,
            type: "booking",
            title: "Payment Verified",
            body:
                booking.bookingStatus === "active"
                    ? "Your payment has been verified and your booking is now active."
                    : "Your payment has been verified. Your booking will activate on your check-in date.",
        });

        // Real-time push to guest
        io.to(booking.guest.toString()).emit("notification", {
            id: notification._id,
            type: "booking",
            title: notification.title,
            body: notification.body,
        });

        res.status(200).json({
            message: 
                booking.bookingStatus === "active"
                    ? "Payment verified and booking activated"
                    : "Payment verified. Booking will activate on check-in date",
            booking
        });

    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to verify receipt",
            error: err.message
        });
    }
}

//////////////////////////
// Reject payment receipt
/////////////////////////
exports.rejectPaymentReceipt = async (req, res) => {
    try{
        const { bookingId } = req.params;
        const { reason } = req.body;

        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        const isAgentOwner = booking.property.postedBy.toString() === req.user._id.toString();
        if (!isAgentOwner && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to reject this receipt" })
        }

        if (booking.paymentStatus !== "receiptUploaded") {
            return res.status(400).json({ 
                message: `Cannot reject receipt. Current payment status: ${booking.paymentStatus}` 
            })
        }

        booking.paymentStatus = "rejected";
        booking.receiptRejectionReason = reason || "invalid or unclear receipt"

        await booking.save();

        // Guest Notification
        const io = getIO();
        
        const notification = await Notification.create({
            user: booking.guest,
            type: "booking",
            title: "Payment Receipt Rejected",
            body: `Your payment receipt was rejected. Reason: ${booking.receiptRejectionReason}`,
        });

        // Real-time push
        io.to(booking.guest.toString()).emit("notification", {
            id: notification._id,
            type: "booking",
            title: notification.title,
            body: notification.body,
        });

        res.status(200).json({ 
            message: "Payment receipt rejected",
            booking 
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ 
            message: "Failed to reject receipt",
            error: err.message
        });
    }
}



