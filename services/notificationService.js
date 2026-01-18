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

exports.emitBookingNotification = (notification) => {
    const io = getIO();

    io.to(notification.user.toString()).emit("notification", {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        body: notification.body
    });
};