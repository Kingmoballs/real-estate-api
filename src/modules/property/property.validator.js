const Joi = require("joi");

const propertyTypes = [
    "apartment",
    "house",
    "duplex",
    "bungalow",
    "land",
    "commercial",
    "office",
    "shop",
    "warehouse",
];

const listingStatuses = [
    "draft",
    "pendingReview",
    "published",
    "rejected",
    "unavailable",
    "rented",
    "sold",
    "archived",
];

const listingTypeSchema = Joi.string().valid(
    "shortlet",
    "rent",
    "sale"
);

const propertyTypeSchema = Joi.string().valid(
    ...propertyTypes
);

const pricePeriodSchema = Joi.when("listingType", {
    switch: [
        {
            is: "shortlet",
            then: Joi.string()
                .valid("night")
                .required(),
        },
        {
            is: "rent",
            then: Joi.string()
                .valid("month", "year")
                .required(),
        },
        {
            is: "sale",
            then: Joi.string()
                .valid("total")
                .required(),
        },
    ],
    otherwise: Joi.forbidden(),
});

const propertyFields = {
    title: Joi.string()
        .trim()
        .min(3)
        .max(200)
        .required(),

    description: Joi.string()
        .trim()
        .min(10)
        .max(5000)
        .required(),

    location: Joi.string()
        .trim()
        .min(2)
        .max(300)
        .required(),

    listingType: listingTypeSchema.required(),

    propertyType: propertyTypeSchema.required(),

    price: Joi.number()
        .positive()
        .required(),

    currency: Joi.string()
        .uppercase()
        .valid("NGN", "USD")
        .default("NGN"),

    pricePeriod: pricePeriodSchema,

    bedrooms: Joi.number()
        .integer()
        .min(0)
        .default(0),

    bathrooms: Joi.number()
        .integer()
        .min(0)
        .default(0),
};

const createPropertySchema = Joi.object({
    ...propertyFields,

    submissionAction: Joi.string()
        .valid("draft", "submit")
        .default("submit"),
});

const updatePropertySchema = Joi.object({
    ...propertyFields,
});

const publicPropertyQuerySchema = Joi.object({
    listingType: listingTypeSchema.optional(),
    propertyType: propertyTypeSchema.optional(),

    pricePeriod: Joi.string()
        .valid("night", "month", "year", "total")
        .optional(),

    currency: Joi.string()
        .uppercase()
        .valid("NGN", "USD")
        .optional(),

    location: Joi.string()
        .trim()
        .max(200)
        .optional(),

    minPrice: Joi.number()
        .min(0)
        .optional(),

    maxPrice: Joi.number()
        .min(0)
        .optional(),

    bedrooms: Joi.number()
        .integer()
        .min(0)
        .optional(),

    bathrooms: Joi.number()
        .integer()
        .min(0)
        .optional(),

    sort: Joi.string()
        .valid("newest", "priceAsc", "priceDesc")
        .default("newest"),

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

const ownedPropertyQuerySchema = Joi.object({
    status: Joi.string()
        .valid(...listingStatuses)
        .optional(),

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

const adminPropertyQuerySchema = Joi.object({
    status: Joi.string()
        .valid(...listingStatuses)
        .optional(),

    listingType: listingTypeSchema.optional(),

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

const rejectPropertySchema = Joi.object({
    reason: Joi.string()
        .trim()
        .min(10)
        .max(500)
        .required(),
});

const updatePropertyStatusSchema = Joi.object({
    status: Joi.string()
        .valid(
            "published",
            "unavailable",
            "rented",
            "sold"
        )
        .required(),
});

module.exports = {
    createPropertySchema,
    updatePropertySchema,
    publicPropertyQuerySchema,
    ownedPropertyQuerySchema,
    adminPropertyQuerySchema,
    rejectPropertySchema,
    updatePropertyStatusSchema
};