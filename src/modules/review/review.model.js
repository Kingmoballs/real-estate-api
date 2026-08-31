const mongoose = require("mongoose");

const REVIEW_STATUSES = ["published", "hidden"];
const VERIFICATION_SOURCES = ["booking", "inspection"];

const agentResponseSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            trim: true,
            minlength: 2,
            maxlength: 1500,
            required: true,
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        respondedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const reviewSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
            index: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        propertyAgent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number",
            },
        },
        title: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "",
        },
        comment: {
            type: String,
            trim: true,
            minlength: 10,
            maxlength: 3000,
            required: true,
        },
        verificationSource: {
            type: String,
            enum: VERIFICATION_SOURCES,
            required: true,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
        },
        inspection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inspection",
            default: null,
        },
        status: {
            type: String,
            enum: REVIEW_STATUSES,
            default: "published",
            index: true,
        },
        moderationReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        moderatedAt: {
            type: Date,
            default: null,
        },
        agentResponse: {
            type: agentResponseSchema,
            default: null,
        },
    },
    { timestamps: true }
);

reviewSchema.pre("validate", function () {
    if (this.verificationSource === "booking") {
        if (!this.booking) {
            this.invalidate(
                "booking",
                "A booking is required for a booking-verified review"
            );
        }
        this.inspection = null;
    }

    if (this.verificationSource === "inspection") {
        if (!this.inspection) {
            this.invalidate(
                "inspection",
                "An inspection is required for an inspection-verified review"
            );
        }
        this.booking = null;
    }
});

reviewSchema.index(
    { property: 1, customer: 1 },
    { unique: true }
);
reviewSchema.index({ property: 1, status: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });
reviewSchema.index({ propertyAgent: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
module.exports.REVIEW_STATUSES = REVIEW_STATUSES;
module.exports.VERIFICATION_SOURCES = VERIFICATION_SOURCES;
