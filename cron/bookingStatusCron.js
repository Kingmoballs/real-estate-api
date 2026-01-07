const cron = require("node-cron");
const Booking = require("../models/Booking");

cron.schedule("0 0 * * *", async () => {
    console.log("Running booking status cron job");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    try {
        // Activate bookings
        await Booking.updateMany(
            {
                bookingStatus: { $in: ["approved"] },
                paymentStatus: "verified",
                checkInDate: { $lte: today },
                checkOutDate: { $gt: today }
            },
            { bookingStatus: "active" }
        );

        // Complete bookings
        await Booking.updateMany(
            {
                bookingStatus: "active",
                checkOutDate: { $lte: today }
            },
            { bookingStatus: "completed" }
        );

        console.log("Booking statuses updated successfully");
    } catch (err) {
        console.error("Cron job error:", err.message);
    }
});