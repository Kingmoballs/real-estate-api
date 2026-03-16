const cron = require("node-cron");
const Booking = require("@/modules/booking/booking.model");
const Notification = require("@/modules/notification/notification.model");
const { getIO } = require("@/socket/socket");
const { onlineUsers } = require("@/shared/utils/onlineUsers");
const { REUPLOAD_TIMEOUT_HOURS } = require("@/config/bookingRules");

const MS_PER_HOUR = 60 * 60 * 1000;

cron.schedule("0 * * * *", async () => {
    console.log("Running booking status cron job");

    const io = getIO(); 

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const EXPIRY_HOURS = 24;
    const expiryDate = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);

    try {
        /////////////////////////
        // Expire unpaid bookings
        /////////////////////////
        const unpaidBookings = await Booking.find({
            bookingStatus: ["pending", "approved"],
            paymentStatus: "unpaid",
            createdAt: { $lte: expiryDate }
        });

        for (const booking of unpaidBookings) {
            booking.bookingStatus = "expired";
            await booking.save();

            const notification = await Notification.create({
                user: booking.guest,
                type: "booking",
                title: "Booking Expired",
                body: "Your booking expired because payment was not completed in time.",
            });

            const socketId = onlineUsers.get(booking.guest.toString());
            if (socketId) {
                io.to(socketId).emit("notification:new", notification);
            }
        }

        /////////////////////
        // Activate bookings
        /////////////////////
        const bookingsToActivate = await Booking.find({
            bookingStatus: "approved",
            paymentStatus: "verified",
            checkInDate: { $lte: endOfToday },
            checkOutDate: { $gt: startOfToday }
        });

        for (const booking of bookingsToActivate) {
            booking.bookingStatus = "active";
            await booking.save();

            const notification = await Notification.create({
                user: booking.guest,
                type: "booking",
                title: "Booking Activated",
                body: "Your booking is now active. Enjoy your stay!",
            });

            const socketId = onlineUsers.get(booking.guest.toString());
            if (socketId) {
                io.to(socketId).emit("notification:new", notification);
            }
        }

        ////////////////////
        //Complete bookings
        ////////////////////
        const bookingsToComplete = await Booking.find({
            bookingStatus: "active",
            checkOutDate: { $lte: startOfToday }
        });

        for (const booking of bookingsToComplete) {
            booking.bookingStatus = "completed";
            await booking.save();

            const notification = await Notification.create({
                user: booking.guest,
                type: "booking",
                title: "Booking Completed",
                body: "Your stay has ended. We hope you enjoyed it!",
            });

            const socketId = onlineUsers.get(booking.guest.toString());
            if (socketId) {
                io.to(socketId).emit("notification:new", notification);
            }
        }

        //////////////////////////
        // Upload receipt timeout
        /////////////////////////
        const now = new Date();

        const expiredBookings = await Booking.find({
            paymentStatus: "rejected",
            bookingStatus: { $in: ["approved", "pending"] },
            receiptRejectedAt: { $exists: true }
        }).populate("guest");

        for (const booking of expiredBookings) {
            const expiryTime =
                new Date(booking.receiptRejectedAt).getTime() +
                REUPLOAD_TIMEOUT_HOURS * MS_PER_HOUR;

            if (now.getTime() > expiryTime) {
            booking.bookingStatus = "cancelled";
            booking.bookingCancelledAt = new Date();
            booking.bookingCancellationReason = "Payment receipt re-upload time expired";

            await booking.save()
            
            const notification = await Notification.create({
                user: booking.guest,
                type: "booking",
                title: "Booking Cancelled",
                body: booking.bookingCancellationReason,
            });

            const socketId = onlineUsers.get(booking.guest.toString());
            if (socketId) {
                io.to(socketId).emit("notification:new", notification);
            }
        }
        }

        console.log("To activate:", bookingsToActivate.length);
        console.log("To complete:", bookingsToComplete.length);

        console.log("Booking cron job completed successfully");
    } catch (err) {
        console.error("Cron job error:", err.message);
    }
});
