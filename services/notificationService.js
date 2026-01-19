const Notification = require("../models/Notification");
const { getIO } = require("../socket/socket");



exports.createBookingNotification = async (
    { agentId, guestName },
    session
) => {
    return Notification.create(
        [
            {
                user: agentId,
                type: "booking",
                title: "New Booking Request",
                body: `${guestName} requested to book your apartment.`
            }
        ],
        { session }
    ).then(res => res[0]);
};

exports.createBookingApprovalNotification = async ({ guestId }) => {
    return Notification.create({
        user: guestId,
        type: "booking",
        title: "Booking Approved",
        body: "Your booking has been approved. Please upload payment receipt to continue"
    });
};

exports.createBookingRejectionNotification = async ({ guestId, reason }) => {
    return Notification.create({
        user: guestId,
        type: "booking",
        title: "Booking Rejected",
        body: `Your booking request was rejected. Reason: ${reason}`
    });
};

exports.createPaymentReceiptUploadedNotification = async ({
    agentId,
    guestName
}) => {
    return Notification.create({
        user: agentId,
        type: "booking",
        title: "Payment Receipt Uploaded",
        body: `${guestName} uploaded a payment receipt for a booking.`
    });
};

exports.createPaymentVerifiedNotification = async (booking) => {
    if (!booking.guest) return null;

    const title = "Payment Verified";
    const body =
        booking.bookingStatus === "active"
            ? "Your payment has been verified and your booking is now active."
            : "Your payment has been verified. Your booking will activate on your check-in date.";

    return Notification.create({
        user: booking.guest,
        type: "booking",
        title,
        body,
    });
};

exports.createPaymentReceiptRejectedNotification = async ({
    guestId,
    reason,
}) => {
    return Notification.create({
        user: guestId,
        type: "booking",
        title: "Payment Receipt Rejected",
        body: `Your payment receipt was rejected. Reason: ${reason}`,
    });
};

exports.emitBookingNotification = (notification) => {
    const io = getIO();

    io.to(notification.user.toString()).emit("notification", {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        body: notification.body
    });
};
