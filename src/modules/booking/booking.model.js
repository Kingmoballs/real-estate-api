const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
            index: true,
        },
        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        guestName: {
            type: String,
            required: true,
            trim: true,
        },
        guestEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        guestPhone: {
            type: String,
            required: true,
            trim: true,
        },
        checkInDate: {
            type: Date,
            required: true,
        },
        checkOutDate: {
            type: Date,
            required: true,
        },

        // Keep a pricing snapshot so later property price changes do not
        // alter an existing booking.
        nightlyPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        numberOfNights: {
            type: Number,
            required: true,
            min: 1,
        },
        currency: {
            type: String,
            enum: ["NGN", "USD"],
            required: true,
            uppercase: true,
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        message: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        bookingStatus: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
                "cancelled",
                "expired",
                "active",
                "completed",
            ],
            default: "pending",
            index: true,
        },
        bookingRejectionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
        requestExpiresAt: {
            type: Date,
            default: null,
            index: true,
        },
        paymentDueAt: {
            type: Date,
            default: null,
            index: true,
        },

        paymentStatus: {
            type: String,
            enum: [
                "unpaid",
                "receiptUploaded",
                "verified",
                "rejected",
            ],
            default: "unpaid",
            index: true,
        },
        paymentReceipt: {
            type: String,
            default: null,
        },
        receiptUploadedAt: {
            type: Date,
            default: null,
        },
        receiptVerifiedAt: {
            type: Date,
            default: null,
        },
        receiptRejectionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },
        receiptRejectedAt: {
            type: Date,
            default: null,
        },
        receiptReuploadDeadline: {
            type: Date,
            default: null,
            index: true,
        },

        bookingCancelledAt: {
            type: Date,
            default: null,
        },
        bookingCancellationReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        cancellationActorRole: {
            type: String,
            enum: ["user", "agent", "admin"],
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

bookingSchema.pre("validate", function () {
    if (
        this.checkInDate &&
        this.checkOutDate &&
        this.checkOutDate <= this.checkInDate
    ) {
        this.invalidate(
            "checkOutDate",
            "Check-out date must be after check-in date"
        );
    }
});

bookingSchema.index({
    property: 1,
    bookingStatus: 1,
    checkInDate: 1,
    checkOutDate: 1,
});
bookingSchema.index({ guest: 1, createdAt: -1 });
bookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
