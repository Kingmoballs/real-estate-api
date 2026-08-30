const cron = require("node-cron");
const Booking = require("@/modules/booking/booking.model");
const Notification = require("@/modules/notification/notification.model");
const { getIO } = require("@/socket/socket");

const emitNotification = (notification) => {
    try {
        const io = getIO();
        io.to(notification.user.toString()).emit(
            "notification",
            {
                id: notification._id,
                type: notification.type,
                bookingId: notification.booking,
                title: notification.title,
                body: notification.body,
            }
        );
    } catch (error) {
        // Database status changes should still complete when sockets are
        // temporarily unavailable.
        console.error(
            "Booking cron socket notification failed:",
            error.message
        );
    }
};

const transitionBookings = async ({
    filter,
    changes,
    title,
    body,
}) => {
    const candidates = await Booking.find(filter).select("_id");
    let transitioned = 0;

    for (const candidate of candidates) {
        // Re-apply the complete filter during the update. This makes each
        // transition idempotent when more than one server runs the cron.
        const booking = await Booking.findOneAndUpdate(
            { ...filter, _id: candidate._id },
            { $set: changes },
            { new: true }
        );

        if (!booking) {
            continue;
        }

        transitioned += 1;

        const notification = await Notification.create({
            user: booking.guest,
            type: "booking",
            booking: booking._id,
            title,
            body:
                typeof body === "function"
                    ? body(booking)
                    : body,
        });

        emitNotification(notification);
    }

    return transitioned;
};

const runBookingStatusJob = async () => {
    console.log("Running booking status cron job");

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);

    try {
        const pendingExpired = await transitionBookings({
            filter: {
                bookingStatus: "pending",
                $or: [
                    { requestExpiresAt: { $lte: now } },
                    { checkInDate: { $lt: startOfToday } },
                ],
            },
            changes: {
                bookingStatus: "expired",
                bookingCancellationReason:
                    "Booking request expired before approval",
            },
            title: "Booking Request Expired",
            body: "Your booking request expired before it was approved.",
        });

        const paymentExpired = await transitionBookings({
            filter: {
                bookingStatus: "approved",
                paymentStatus: "unpaid",
                paymentDueAt: { $lte: now },
            },
            changes: {
                bookingStatus: "expired",
                bookingCancellationReason:
                    "Payment was not submitted before the deadline",
            },
            title: "Booking Expired",
            body: "Your booking expired because payment was not submitted before the deadline.",
        });

        const activated = await transitionBookings({
            filter: {
                bookingStatus: "approved",
                paymentStatus: "verified",
                checkInDate: { $lte: startOfToday },
                checkOutDate: { $gt: startOfToday },
            },
            changes: { bookingStatus: "active" },
            title: "Booking Activated",
            body: "Your booking is now active. Enjoy your stay!",
        });

        const completed = await transitionBookings({
            filter: {
                bookingStatus: "active",
                checkOutDate: { $lte: startOfToday },
            },
            changes: { bookingStatus: "completed" },
            title: "Booking Completed",
            body: "Your stay has ended. We hope you enjoyed it!",
        });

        const reuploadExpired = await transitionBookings({
            filter: {
                bookingStatus: "approved",
                paymentStatus: "rejected",
                receiptReuploadDeadline: { $lte: now },
            },
            changes: {
                bookingStatus: "cancelled",
                bookingCancelledAt: now,
                bookingCancellationReason:
                    "Payment receipt re-upload deadline expired",
            },
            title: "Booking Cancelled",
            body: "Your booking was cancelled because the receipt re-upload deadline expired.",
        });

        console.log("Booking cron transitions:", {
            pendingExpired,
            paymentExpired,
            activated,
            completed,
            reuploadExpired,
        });
    } catch (error) {
        console.error("Booking cron job error:", error.message);
    }
};

cron.schedule("0 * * * *", runBookingStatusJob);

module.exports = { runBookingStatusJob };
