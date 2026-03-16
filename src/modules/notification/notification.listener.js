const eventBus = require("@/shared/events/eventBus");
const EVENTS = require("@/shared/events/eventRegistry");
const notificationService = require("./notification.service");

eventBus.on(EVENTS.BOOKING_CREATED, async (payload) => {
    try {
        const notification =
            await notificationService.createBookingNotification(payload);

        await notificationService.emitBookingNotification(notification);
    } catch (err) {
        console.error("Booking notification failed:", err.message);
    }
});

eventBus.on(EVENTS.BOOKING_APPROVED, async (payload) => {
    try {
        const notification =
            await notificationService.createBookingApprovalNotification(payload);

        await notificationService.emitBookingNotification(notification);
    } catch (err) {
        console.error("Approval notification failed:", err.message);
    }
});

eventBus.on(EVENTS.BOOKING_REJECTED, async (payload) => {
    try {
        const notification =
            await notificationService.createBookingRejectionNotification(payload);

        await notificationService.emitBookingNotification(notification);
    } catch (err) {
        console.error("Rejection notification failed:", err.message);
    }
});

eventBus.on(EVENTS.BOOKING_RECEIPT_UPLOADED, async (payload) => {
    try {
        const notification =
            await notificationService.createPaymentReceiptUploadedNotification(payload);

        await notificationService.emitBookingNotification(notification);
    } catch (err) {
        console.error("Receipt notification failed:", err.message);
    }
});

eventBus.on(EVENTS.BOOKING_PAYMENT_VERIFIED, async (payload) => {
    try {
        const notification =
            await notificationService.createPaymentVerifiedNotification(payload);

        await notificationService.emitBookingNotification(notification);
    } catch (err) {
        console.error("Payment verification notification failed:", err.message);
    }
});    

eventBus.on(EVENTS.BOOKING_PAYMENT_REJECTED, async (payload) => {
    try {
        const notification =
            await notificationService.createPaymentRejectedNotification(payload);

        await notificationService.emitBookingNotification(notification);
    } catch (err) {
        console.error("Payment rejection notification failed:", err.message);
    }
});

eventBus.on(EVENTS.MESSAGE_SENT, async (payload) => {
    try {
        const notification =
        await notificationService.createMessageNotification({
            recipientId: payload.recipientId,
            conversationId: payload.conversationId,
            messageId: payload.messageId,
        });

        await notificationService.emitMessageNotification(notification);

        if (payload.markDelivered) {
            await payload.markDelivered();
        }

    } catch (err) {
        console.error("Message notification failed:", err.message);
    }
});