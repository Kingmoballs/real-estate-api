const mongoose = require("mongoose");
const bookingRepository = require("../repositories/bookingRepository");
const propertyRepository = require("../repositories/propertyRepository");
const NotificationService = require("./notificationService");
const { acquireLock, releaseLock } = require("../utils/redisLock");
const { shouldActivateBooking } = require("../utils/bookingUtils");
const ApiError = require("../utils/ApiError");

const { REUPLOAD_TIMEOUT_HOURS } = require("../config/bookingRules");

// Create new booking
exports.createBooking = async ({ user, payload }) => {
    const session = await mongoose.startSession();
    let lockToken;

    const { property, checkInDate, checkOutDate } = payload;
    const lockKey = `booking:${property}:${checkInDate}:${checkOutDate}`;

    try {
        // Acquire Redis lock
        lockToken = await acquireLock(lockKey);

        // Start DB transaction
        session.startTransaction();

        const apartment = await propertyRepository.findById(property);
        if (!apartment || apartment.propertyType !== "serviced") {
            throw new ApiError(400, "Invalid or non-serviced apartment selected");
        }

        const start = new Date(`${checkInDate}T00:00:00.000Z`);
        const end = new Date(`${checkOutDate}T00:00:00.000Z`);

        if (isNaN(start) || isNaN(end) || end <= start) {
            throw new ApiError(400, "Invalid booking dates");
        }

        const conflict = await bookingRepository.findConflictingBooking({
            property,
            start,
            end,
            session
        });

        if (conflict) {
            throw new ApiError(409, "Apartment already booked for selected dates");
        }

        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        const booking = await bookingRepository.create(
        {
            property,
            guest: user._id,
            guestName: user.name,
            guestEmail: user.email,
            guestPhone: user.phone,
            checkInDate: start,
            checkOutDate: end,
            totalPrice: days * apartment.dailyRate,
            bookingStatus: "pending",
            paymentStatus: "unpaid"
        },
        session
        );

        await session.commitTransaction();
        session.endSession();

        await releaseLock(lockKey, lockToken);

        NotificationService.createBookingNotification({
            agentId: apartment.postedBy,
            guestName: user.name
        })
        .then(NotificationService.emitBookingNotification)
        .catch(err => {
            console.error("Notification failed:", err.message);
        });

        return booking;

    } catch (err) {
        await session.abortTransaction().catch(() => {});
        session.endSession();

        if (lockToken) {
            await releaseLock(lockKey, lockToken);
        }

        throw err;
    }
};

// Approve booking
exports.approveBooking = async ({ bookingId, agent }) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const booking = await bookingRepository.findByIdWithProperty(
            bookingId,
            session
        );

        if (!booking) {
            throw new ApiError(404, "Booking not found");
        }

        // Authorization: only property owner can approve
        if (booking.property.postedBy.toString() !== agent._id.toString()) {
            throw new ApiError(403, "You are not authorized to approve this booking");
        }

        if (booking.bookingStatus !== "pending") {
            throw new ApiError(
                400,
                `Booking cannot be approved. Current status: ${booking.bookingStatus}`
            );
        }

        await bookingRepository.updateStatus(
            booking,
            "approved",
            session
        );

        await session.commitTransaction();
        session.endSession();

        // notification
        NotificationService.createBookingApprovalNotification({
            guestId: booking.guest,
        })
        .then(NotificationService.emitBookingNotification)
        .catch(err =>
            console.error("Approval notification failed:", err.message)
        );

        return booking;

    } catch (err) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
        throw err;
    }
}

// Reject booking
exports.rejectBooking = async ({ bookingId, agent, reason }) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const booking = await bookingRepository.findByIdWithProperty(
            bookingId,
            session
        );

        if (!booking) {
            throw new ApiError(404, "Booking not found");
        }

        // Authorization
        if (booking.property.postedBy.toString() !== agent._id.toString()) {
            throw new ApiError(403, "You are not authorized to reject this booking");
        }

        if (booking.bookingStatus !== "pending") {
            throw new ApiError(
                400,
                `Booking cannot be rejected. Current status: ${booking.bookingStatus}`
            );
        }

        const rejectionReason = reason?.trim() || "No reason provided";

        await bookingRepository.reject(
            booking,
            rejectionReason,
            session
        );

        await session.commitTransaction();
        session.endSession();
        

        //Notification
        NotificationService.createBookingRejectionNotification({
            guestId: booking.guest,
            reason: rejectionReason
        })
        .then(NotificationService.emitBookingNotification)
        .catch(err =>
            console.error("Rejection notification failed:", err.message)
        );

        return booking;

    } catch (err) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
        throw err;
    }
};

// Upload payment receipt for booking
exports.uploadPaymentReceipt = async ({ bookingId, user, file }) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const booking = await bookingRepository.findByIdWithProperty(bookingId, session);
        if (!booking) {
            throw new ApiError(404, "Booking not found");
        }

        // Authorization
        if (booking.guest.toString() !== user._id.toString()) {
            throw new ApiError(
                403,
                "You are not authorized to upload receipt for this booking"
            );
        }

        if (["expired", "completed"].includes(booking.bookingStatus)) {
            throw new ApiError(
                400,
                `Cannot upload receipt for a ${booking.bookingStatus} booking`
            );
        }

        if (booking.bookingStatus !== "approved") {
            throw new ApiError(
                400,
                "Receipt can only be uploaded after booking approval"
            );
        }

        // Payment state validation
        if (booking.paymentStatus === "verified") {
            throw new ApiError(400, "Receipt already verified");
        }

        if (booking.paymentStatus === "receiptUploaded") {
            throw new ApiError(400, "Receipt already uploaded");
        }

        // Re-upload window check
        if (booking.paymentStatus === "rejected") {
            const expiry =
                new Date(booking.receiptRejectedAt).getTime() +
                REUPLOAD_TIMEOUT_HOURS * 60 * 60 * 1000;

            if (Date.now() > expiry) {
                throw new ApiError(
                    403,
                    "Re-upload window expired. Booking cancelled."
                );
            }
        }

        if (!file) {
            throw new ApiError(400, "Payment receipt file is required");
        }

        await bookingRepository.uploadReceipt(
            booking,
            file.path,
            session
        );

        await session.commitTransaction();
        session.endSession();

        // Notification
        NotificationService.createPaymentReceiptUploadedNotification({
            agentId: booking.property.postedBy,
            guestName: user.name
        })
        .then(NotificationService.emitBookingNotification)
        .catch(err =>
            console.error("Receipt notification failed:", err.message)
        );

        return booking;

    } catch (err) {
        await session.abortTransaction().catch(() => {});
        session.endSession();
        throw err;
    }
};

// Verify payment receipt for booking
exports.verifyPaymentReceipt = async ({ bookingId, user }) => {
    const booking =
        await bookingRepository.findByIdWithProperty(bookingId);

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const isAgentOwner =
        booking.property.postedBy.toString() === user._id.toString();

    if (!isAgentOwner && user.role !== "admin") {
        throw new ApiError(
            403,
            "You are not authorized to verify this receipt"
        );
    }

    if (booking.paymentStatus !== "receiptUploaded") {
        throw new ApiError(
            400,
            `Cannot verify receipt. Current status: ${booking.paymentStatus}`
        );
    }

    const shouldActivate =
        shouldActivateBooking(booking.checkInDate);

    const updatedBooking =
        await bookingRepository.verifyPaymentReceipt(
            booking,
            { activate: shouldActivate }
        );

    // Notification
    NotificationService
        .createPaymentVerifiedNotification(updatedBooking)
        .then(NotificationService.emitBookingNotification)
        .catch(err =>
            console.error(
                "Payment verification notification failed:",
                err
            )
        );

    return updatedBooking;
};

// Reject payment receipt for booking
exports.rejectPaymentReceipt = async ({
    bookingId,
    user,
    reason,
}) => {
    const booking =
        await bookingRepository.findByIdWithProperty(bookingId);

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const isAgentOwner =
        booking.property.postedBy.toString() === user._id.toString();

    if (!isAgentOwner && user.role !== "admin") {
        throw new ApiError(
            403,
            "You are not authorized to reject this receipt"
        );
    }

    if (booking.paymentStatus !== "receiptUploaded") {
        throw new ApiError(
            400,
            `Cannot reject receipt. Current payment status: ${booking.paymentStatus}`
        );
    }

    const updatedBooking =
        await bookingRepository.rejectPaymentReceipt(
            booking,
            reason
        );

    // Notification
    NotificationService
        .createPaymentReceiptRejectedNotification({
            guestId: booking.guest,
            reason: updatedBooking.receiptRejectionReason,
        })
        .then(NotificationService.emitBookingNotification)
        .catch(err =>
            console.error(
                "Receipt rejection notification failed:",
                err
            )
        );

    return updatedBooking;
};