const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const Property = require("../models/Property");
const { shouldActivateBooking } = require("../utils/bookingUtils")
const user = require("../models/user");


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
        res.status(201).json(saved); 
    }
    catch (err) {
        res.status(500).json({ err: err.message });
    }
    
}

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

exports.rejectBooking = async (req, res) => {
    try{
        const { bookingId } = req.params;
        const { reason } = req.body;

        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.property.postedBy.toString() !== req.user._id.toSting()) {
            return res.status(403).json({ message: "You are not authorized to reject this booking" });
        }

        if (booking.bookingStatus !== "pending") {
            return res.status(400).json({ message: `Booking cannot be rejected. Current Status: ${booking.bookingStatus}` });
        }

        booking.bookingStatus = "rejected";
        booking.rejectionReason = reason || "No reason provided";

        await booking.save();

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

        if (booking.paymentStatus === "receipt_uploaded") {
            return res.status(400).json({
                message: "Receipt already uploaded"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Payment receipt file is required"
            });
        }

        booking.paymentReceipt = req.file.path;
        booking.paymentStatus = "receiptUploaded";
        booking.receiptUploadedAt = new Date();

        await booking.save();

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

exports.rejectPaymentReceipt = async (req, res) => {
    try{
        const { bookingId } = req.params;
        const { reason } = req.body;

        const booking = await Booking.findById(bookingId).populate("property");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        const isAgentOwner = booking.property.postedBy.toString() === req.user._id.toString();
        if (!isAgentOwner && req.user._id !== "admin") {
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



