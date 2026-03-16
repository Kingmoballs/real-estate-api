const Notification = require("./notification.model");
const notificationRepository = require("./notification.repository");
const ApiError = require("@/shared/utils/ApiError");

const { getIO } = require("@/socket/socket");


// Get notifications for user
exports.getUserNotifications = async ({ user }) => {
    return notificationRepository.findByUser(user.id);
};

// Mark one notification as read
exports.markNotificationAsRead = async ({ notificationId, user }) => {
    const notification = await notificationRepository.markAsRead(
        notificationId,
        user.id
    );

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return notification;
};


exports.getUnreadCount = async ({ userId }) => {
    return Notification.countDocuments({
        user: userId,
        isRead: false,
    });
};

/////////////////////////
// Booking Notifications
/////////////////////////

// Create booking notification for agent
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

// Create booking approval notification for guest
exports.createBookingApprovalNotification = async ({ guestId }) => {
    return Notification.create({
        user: guestId,
        type: "booking",
        title: "Booking Approved",
        body: "Your booking has been approved. Please upload payment receipt to continue"
    });
};

// Create booking rejection notification for guest
exports.createBookingRejectionNotification = async ({ guestId, reason }) => {
    return Notification.create({
        user: guestId,
        type: "booking",
        title: "Booking Rejected",
        body: `Your booking request was rejected. Reason: ${reason}`
    });
};

// Create payment receipt uploaded notification for agent
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

// Create payment verified notification for guest
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

// Create payment receipt rejected notification for guest
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

// Emit booking notification via socket
exports.emitBookingNotification = (notification) => {
    const io = getIO();

    io.to(notification.user.toString()).emit("notification", {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        body: notification.body
    });
};

/////////////////////////
// Message Notifications
/////////////////////////

// Create message notification for recipient
exports.createMessageNotification = async (
    { recipientId, conversationId, messageId },
    session
) => {
    return Notification.create(
        [
            {
                user: recipientId,
                type: "message",
                conversation: conversationId,
                message: messageId,
            },
        ],
        { session }
    ).then(res => res[0]);
};

// Emit message notification via socket
exports.emitMessageNotification = (notification) => {
    const io = getIO();

    io.to(notification.user.toString()).emit("notification", {
        id: notification._id,
        type: notification.type,
        conversationId: notification.conversation,
        message: "New message received",
    });
};