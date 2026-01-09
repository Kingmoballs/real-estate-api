const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    guestName: {
        type: String,
        required: true,
    },
    guestEmail: {
        type: String,
        required: true,
    },
    guestPhone: {
        type: String,
        required: true,
    },
    checkInDate: {
        type: String,
        required: true,
    },
    checkOutDate: {
        type: String,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    message: {
        type: String,
    },
    bookingStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "cancelled", "expired", "active", "completed"],
        default: "pending",
    },
    receiptRejectionReason: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "receiptUploaded", "verified", "rejected"],
        default: "unpaid"
    },
    paymentReceipt: {
        type: String
    },
    receiptUploadedAt: {
        type: Date
    },
    receiptVerifiedAt: {
        type: Date
    }

}, {timestamps: true});

module.exports = mongoose.model("Booking", bookingSchema);