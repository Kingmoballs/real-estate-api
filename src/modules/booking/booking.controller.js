const BookingService = require("./booking.service");

exports.checkAvailability = async (req, res, next) => {
    try {
        const availability =
            await BookingService.checkAvailability({
                propertyId: req.params.propertyId,
                query: req.query,
            });

        res.status(200).json(availability);
    } catch (err) {
        next(err);
    }
};

exports.getAvailabilityCalendar = async (req, res, next) => {
    try {
        const calendar =
            await BookingService.getAvailabilityCalendar({
                propertyId: req.params.propertyId,
                query: req.query,
            });

        res.status(200).json(calendar);
    } catch (err) {
        next(err);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const result = await BookingService.getUserBookings({
            user: req.user,
            query: req.query,
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

exports.getAgentBookings = async (req, res, next) => {
    try {
        const result = await BookingService.getAgentBookings({
            agent: req.user,
            query: req.query,
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

exports.getAdminBookings = async (req, res, next) => {
    try {
        const result = await BookingService.getAdminBookings({
            query: req.query,
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

exports.getBookingById = async (req, res, next) => {
    try {
        const booking = await BookingService.getBookingById({
            bookingId: req.params.bookingId,
            user: req.user,
        });

        res.status(200).json({ booking });
    } catch (err) {
        next(err);
    }
};

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

exports.cancelBooking = async (req, res, next) => {
    try {
        const booking = await BookingService.cancelBooking({
            bookingId: req.params.bookingId,
            user: req.user,
            reason: req.body.reason,
        });

        res.status(200).json({
            message: "Booking cancelled successfully",
            booking,
        });
    } catch (err) {
        next(err);
    }
};

/////////////////////////
// Upload payment receipt
/////////////////////////
exports.uploadPaymentReceipt = async (req, res, next) => {
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
