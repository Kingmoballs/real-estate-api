const BookingService = require("../services/bookingService");

////////////////////////
// Create a new booking
////////////////////////
exports.createBooking = async(req, res, next) => {
    try {
        const booking =  await BookingService.createBooking({
            user: req.user,
            payload: req.body
        }); 

        res.status(201).json({
            message: "Booking created successfully",
            booking
        });
    }
    catch (err) {
        next(err);
    }
}

/////////////////////
// Approve a booking
////////////////////
exports.approveBooking = async (req, res, next) => {
    try {
        const booking = await BookingService.approveBooking({
            bookingId: req.params.bookingId,
            agent: req.user
        });
        
        res.status(200).json({
            message: "Booking approved successfully",
            booking
        })
    }
    catch (err) {
        next(err)
    }
}

////////////////////
// Reject a booking
////////////////////
exports.rejectBooking = async (req, res, next) => {
    try {
        const booking = await BookingService.rejectBooking({
            bookingId: req.params.bookingId,
            agent: req.user,
            reason: req.body.reason
        })

        res.status(200).json({ 
            message: "Booking rejected successfully",
            booking
        })
    }
    catch (err) {
        next(err)
    }
}

/////////////////////////
// Upload payment receipt
/////////////////////////
exports.uploadPaymentReceipt = async (req, res) => {
    try {
        const booking = await BookingService.uploadPaymentReceipt({
            bookingId: req.params.bookingId,
            user: req.user,
            file: req.file
        });

        res.status(200).json({
            message: "Payment receipt uploaded successfully",
            booking
        });
    } catch (err) {
        next(err);
    }
};

/////////////////////////
// Verify payment receipt
/////////////////////////
exports.verifyPaymentReceipt = async (req, res, next) => {
    try {
        const booking = await BookingService.verifyPaymentReceipt({
            bookingId: req.params.bookingId,
            user: req.user,
        });

        res.status(200).json({
            message:
                booking.bookingStatus === "active"
                    ? "Payment verified and booking activated"
                    : "Payment verified. Booking will activate on check-in date",
            booking,
        });
    } catch (err) {
        next(err);
    }
};

//////////////////////////
// Reject payment receipt
/////////////////////////
exports.rejectPaymentReceipt = async (req, res, next) => {
    try {
        const booking =
            await BookingService.rejectPaymentReceipt({
                bookingId: req.params.bookingId,
                user: req.user,
                reason: req.body.reason,
            });

        res.status(200).json({
            message: "Payment receipt rejected",
            booking,
        });
    } catch (err) {
        next(err);
    }
};