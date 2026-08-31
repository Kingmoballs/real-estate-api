const Joi = require("joi");

const INSPECTION_STATUSES = [
    "pending",
    "confirmed",
    "rescheduleProposed",
    "rejected",
    "cancelled",
    "completed",
];

const objectIdSchema = Joi.string()
    .hex()
    .length(24);

const createInspectionSchema = Joi.object({
    property: objectIdSchema.required(),

    requestedFor: Joi.date()
        .iso()
        .required(),

    message: Joi.string()
        .trim()
        .max(1000)
        .allow("")
        .default(""),
});

const rescheduleInspectionSchema = Joi.object({
    proposedFor: Joi.date()
        .iso()
        .required(),

    message: Joi.string()
        .trim()
        .max(1000)
        .allow("")
        .default(""),
});

const reasonSchema = Joi.object({
    reason: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .required(),
});

const inspectionQuerySchema = Joi.object({
    status: Joi.string()
        .valid(...INSPECTION_STATUSES)
        .optional(),

    property: objectIdSchema.optional(),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20),
});

module.exports = {
    INSPECTION_STATUSES,
    createInspectionSchema,
    rescheduleInspectionSchema,
    rejectInspectionSchema: reasonSchema,
    cancelInspectionSchema: reasonSchema,
    inspectionQuerySchema,
};