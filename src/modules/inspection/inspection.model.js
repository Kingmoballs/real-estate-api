const mongoose = require("mongoose");

const INSPECTION_STATUSES = [
    "pending",
    "confirmed",
    "rescheduleProposed",
    "rejected",
    "cancelled",
    "completed",
];

const inspectionSchema = new mongoose.Schema(
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

        agent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        requestedFor: {
            type: Date,
            required: true,
            index: true,
        },

        scheduledFor: {
            type: Date,
            default: null,
            index: true,
        },

        proposedFor: {
            type: Date,
            default: null,
        },

        durationMinutes: {
            type: Number,
            default: 60,
            min: 30,
            max: 240,
        },

        message: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        agentMessage: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        status: {
            type: String,
            enum: INSPECTION_STATUSES,
            default: "pending",
            index: true,
        },

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },

        cancellationReason: {
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

        confirmedAt: {
            type: Date,
            default: null,
        },

        rejectedAt: {
            type: Date,
            default: null,
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

inspectionSchema.index({
    customer: 1,
    createdAt: -1,
});

inspectionSchema.index({
    agent: 1,
    status: 1,
    scheduledFor: 1,
});

inspectionSchema.index({
    property: 1,
    status: 1,
});

module.exports = mongoose.model(
    "Inspection",
    inspectionSchema
);

module.exports.INSPECTION_STATUSES =
    INSPECTION_STATUSES;