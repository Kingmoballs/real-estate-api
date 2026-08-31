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
            await notificationService.createPaymentReceiptRejectedNotification(
                payload
            );

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

eventBus.on(EVENTS.BOOKING_CANCELLED, async (payload) => {
    try {
        const notification =
            await notificationService.createBookingCancellationNotification(
                payload
            );

        await notificationService.emitBookingNotification(notification);
    } catch (err) {
        console.error("Cancellation notification failed:", err.message);
    }
});

const inspectionEvents = [
    EVENTS.INSPECTION_CREATED,
    EVENTS.INSPECTION_CONFIRMED,
    EVENTS.INSPECTION_RESCHEDULE_PROPOSED,
    EVENTS.INSPECTION_RESCHEDULE_ACCEPTED,
    EVENTS.INSPECTION_REJECTED,
    EVENTS.INSPECTION_CANCELLED,
    EVENTS.INSPECTION_COMPLETED,
];

inspectionEvents.forEach((eventName) => {
    eventBus.on(eventName, async (payload) => {
        try {
            const notification =
                await notificationService
                    .createInspectionNotification(
                        payload
                    );

            await notificationService
                .emitInspectionNotification(
                    notification
                );
        } catch (error) {
            console.error(
                `Inspection notification failed for ${eventName}:`,
                error.message
            );
        }
    });
});

const reviewEvents = [
    EVENTS.REVIEW_CREATED,
    EVENTS.REVIEW_RESPONDED,
    EVENTS.REVIEW_MODERATED,
];

reviewEvents.forEach((eventName) => {
    eventBus.on(eventName, async (payload) => {
        try {
            const notification =
                await notificationService.createReviewNotification(
                    payload
                );

            await notificationService.emitReviewNotification(
                notification
            );
        } catch (error) {
            console.error(
                `Review notification failed for ${eventName}:`,
                error.message
            );
        }
    });
});
