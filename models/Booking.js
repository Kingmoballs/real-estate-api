const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
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
        type: Date,
        required: true,
    },
    checkOutDate: {
        type: Date,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    message: {
        type: String,
    },

}, {timestamps: true});

module.exports = mongoose.model("booking", bookingSchema);