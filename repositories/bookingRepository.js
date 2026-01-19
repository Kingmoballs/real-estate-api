const Booking = require("../models/Booking");

exports.findConflictingBooking = async ({
    property,
    start,
    end,
    statuses = ["pending", "approved", "active"],
    session
}) => {
    return Booking.findOne({
        property,
        bookingStatus: { $in: statuses },
        checkInDate: { $lt: end },
        checkOutDate: { $gt: start }
    }).session(session);
};

exports.findByIdWithProperty = (bookingId, session) => {
    return Booking.findById(bookingId)
        .populate("property")
        .session(session);
};

exports.findById = (bookingId, session) => {
    return Booking.findById(bookingId).session(session);
}

exports.updateStatus = (booking, status, session) => {
    booking.bookingStatus = status;
    return booking.save({ session })
};

exports.reject = (booking, reason, session) => {
    booking.bookingStatus = "rejected";
    booking.rejectionReason = reason;
    return booking.save({ session })

}

exports.uploadReceipt = (booking, receiptPath, session) => {
    booking.paymentReceipt = receiptPath;
    booking.paymentStatus = "receiptUploaded";
    booking.receiptUploadedAt = new Date();
    return booking.save({ session })
}

exports.verifyPaymentReceipt = async (booking, { activate }) => {
    booking.paymentStatus = "verified";
    booking.receiptVerifiedAt = new Date();

    if (activate) {
        booking.bookingStatus = "active";
    }

    return booking.save();
};

exports.rejectPaymentReceipt = async (booking, reason) => {
    booking.paymentStatus = "rejected";
    booking.receiptRejectionReason = 
        reason || "invalid or unclear receipt",
    booking.receiptRejectedAt = new Date();

    return booking.save()
}

exports.create = async (data, session) => {
    return Booking.create([data], { session }).then(res => res[0]);
};

exports.save = (booking) => booking.save();
