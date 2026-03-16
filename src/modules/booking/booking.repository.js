const Booking = require("./booking.model");

// Find conflicting booking for a property within a date range
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

// Find booking by ID with populated property details
exports.findByIdWithProperty = (bookingId, session) => {
    return Booking.findById(bookingId)
        .populate("property")
        .session(session);
};

// Find booking by ID
exports.findById = (bookingId, session) => {
    return Booking.findById(bookingId).session(session);
}

// Update booking status
exports.updateStatus = (booking, status, session) => {
    booking.bookingStatus = status;
    return booking.save({ session })
};

// Reject booking with reason
exports.reject = (booking, reason, session) => {
    booking.bookingStatus = "rejected";
    booking.rejectionReason = reason;
    return booking.save({ session })

}

// Upload payment receipt for booking
exports.uploadReceipt = (booking, receiptPath, session) => {
    booking.paymentReceipt = receiptPath;
    booking.paymentStatus = "receiptUploaded";
    booking.receiptUploadedAt = new Date();
    return booking.save({ session })
}

// Verify payment receipt for booking
exports.verifyPaymentReceipt = async (booking, { activate }) => {
    booking.paymentStatus = "verified";
    booking.receiptVerifiedAt = new Date();

    if (activate) {
        booking.bookingStatus = "active";
    }

    return booking.save();
};

// Reject payment receipt for booking
exports.rejectPaymentReceipt = async (booking, reason) => {
    booking.paymentStatus = "rejected";
    booking.receiptRejectionReason = 
        reason || "invalid or unclear receipt",
    booking.receiptRejectedAt = new Date();

    return booking.save()
}

// Create new booking
exports.create = async (data, session) => {
    return Booking.create([data], { session }).then(res => res[0]);
};

// Save booking
exports.save = (booking) => booking.save();

// Aggregate functions for bookings related to properties
exports.countByProperties = async (propertyIds) => {
    return Booking.countDocuments({ property: { $in: propertyIds } });
};

// Calculate total revenue for properties
exports.calculateTotalRevenue = async (propertyIds) => {
    const result = await Booking.aggregate([
        { $match: { property: { $in: propertyIds } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    return result.length ? result[0].total : 0;
};

// Get booking statistics for properties
exports.getPropertyStats = async (propertyIds) => {
    return Booking.aggregate([
        { $match: { property: { $in: propertyIds } } },
        {
            $group: {
                _id: "$property",
                bookingCount: { $sum: 1 },
                totalRevenue: { $sum: "$totalPrice" },
            },
        },
    ]);
};

exports.getStatsByDateRange = async ({ propertyIds, startDate, endDate }) => {
    return Booking.aggregate([
        {
            $match: {
                property: { $in: propertyIds },
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            },
        },
        {
            $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                totalRevenue: { $sum: "$totalPrice" },
            },
        },
    ]);
};
