const mongoose = require("mongoose");

const agentApplicationSchema = new mongoose.Schema(
    {
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        businessType: {
            type: String,
            enum: ["individual", "company"],
            required: true,
        },
        businessName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },
        registrationNumber: {
            type: String,
            trim: true,
            default: null,
            required: function () {
                return this.businessType === "company";
            },
        },
        yearsOfExperience: {
            type: Number,
            min: 0,
            max: 70,
            default: 0,
        },
        serviceAreas: {
            type: [
                {
                    type: String,
                    trim: true,
                    minlength: 2,
                    maxlength: 100,
                },
            ],
            validate: {
                validator(value) {
                    return (
                        Array.isArray(value) &&
                        value.length > 0
                    );
                },
                message:
                    "At least one service area is required",
            },
        },
        officeAddress: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },
        bio: {
            type: String,
            required: true,
            trim: true,
            minlength: 30,
            maxlength: 1000,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        },
        submissionCount: {
            type: Number,
            default: 1,
            min: 1,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: null,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

agentApplicationSchema.index({
    status: 1,
    submittedAt: -1,
});

module.exports = mongoose.model(
    "AgentApplication",
    agentApplicationSchema
);