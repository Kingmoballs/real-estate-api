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

exports.updateStatus = (booking, status, session) => {
    booking.bookingStatus = status;
    return booking.save({ session })
};

exports.create = async (data, session) => {
    return Booking.create([data], { session }).then(res => res[0]);
};
