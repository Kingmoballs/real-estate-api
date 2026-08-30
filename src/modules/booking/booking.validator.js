const Joi = require("joi");

const BOOKING_STATUSES = [
    "pending",
    "approved",
    "rejected",
    "cancelled",
    "expired",
    "active",
    "completed",
];

const PAYMENT_STATUSES = [
    "unpaid",
    "receiptUploaded",
    "verified",
    "rejected",
];

const objectIdSchema = Joi.string()
    .hex()
    .length(24);

const dateOnlySchema = Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
        const date = new Date(`${value}T00:00:00.000Z`);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== value
        ) {
            return helpers.message({
                custom: "{{#label}} must be a valid date in YYYY-MM-DD format",
            });
        }

        return value;
    })
    .messages({
        "string.pattern.base":
            "{{#label}} must use YYYY-MM-DD format",
    });

const validateDateRange = (
    startField,
    endField
) => (value, helpers) => {
    const start = new Date(
        `${value[startField]}T00:00:00.000Z`
    );
    const end = new Date(
        `${value[endField]}T00:00:00.000Z`
    );

    if (end <= start) {
        return helpers.message({
            custom: `${endField} must be after ${startField}`,
        });
    }

    return value;
};

const createBookingSchema = Joi.object({
    property: objectIdSchema.required(),
    checkInDate: dateOnlySchema.required(),
    checkOutDate: dateOnlySchema.required(),
    message: Joi.string()
        .trim()
        .max(1000)
        .allow("")
        .default(""),
}).custom(validateDateRange("checkInDate", "checkOutDate"));

const availabilityQuerySchema = Joi.object({
    checkInDate: dateOnlySchema.required(),
    checkOutDate: dateOnlySchema.required(),
}).custom(validateDateRange("checkInDate", "checkOutDate"));

const availabilityCalendarQuerySchema = Joi.object({
    from: dateOnlySchema.required(),
    to: dateOnlySchema.required(),
}).custom(validateDateRange("from", "to"));

const bookingQuerySchema = Joi.object({
    status: Joi.string()
        .valid(...BOOKING_STATUSES)
        .optional(),
    paymentStatus: Joi.string()
        .valid(...PAYMENT_STATUSES)
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

const rejectBookingSchema = Joi.object({
    reason: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .required(),
});

const cancelBookingSchema = Joi.object({
    reason: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .required(),
});

const rejectReceiptSchema = Joi.object({
    reason: Joi.string()
        .trim()
        .min(3)
        .max(500)
        .required(),
});

module.exports = {
    BOOKING_STATUSES,
    PAYMENT_STATUSES,
    createBookingSchema,
    availabilityQuerySchema,
    availabilityCalendarQuerySchema,
    bookingQuerySchema,
    rejectBookingSchema,
    cancelBookingSchema,
    rejectReceiptSchema,
};
