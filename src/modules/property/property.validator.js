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

const listingTypeSchema = Joi.string()
    .valid("shortlet", "rent", "sale");

const propertyTypeSchema = Joi.string()
    .valid(...propertyTypes);

const pricePeriodSchema = Joi.when("listingType", {
    switch: [
        {
            is: "shortlet",
            then: Joi.string().valid("night").required(),
        },
        {
            is: "rent",
            then: Joi.string()
                .valid("month", "year")
                .required(),
        },
        {
            is: "sale",
            then: Joi.string().valid("total").required(),
        },
    ],
    otherwise: Joi.forbidden(),
});

const createPropertySchema = Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().trim().min(10).required(),
    location: Joi.string().trim().min(2).required(),

    listingType: listingTypeSchema.required(),
    propertyType: propertyTypeSchema.required(),

    price: Joi.number().positive().required(),
    currency: Joi.string()
        .uppercase()
        .valid("NGN", "USD")
        .default("NGN"),
    pricePeriod: pricePeriodSchema,

    bedrooms: Joi.number().integer().min(0).default(0),
    bathrooms: Joi.number().integer().min(0).default(0),
});

const updatePropertySchema = Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().trim().min(10).required(),
    location: Joi.string().trim().min(2).required(),

    listingType: listingTypeSchema.required(),
    propertyType: propertyTypeSchema.required(),

    price: Joi.number().positive().required(),
    currency: Joi.string()
        .uppercase()
        .valid("NGN", "USD")
        .default("NGN"),
    pricePeriod: pricePeriodSchema,

    bedrooms: Joi.number().integer().min(0),
    bathrooms: Joi.number().integer().min(0),
});

module.exports = {
    createPropertySchema,
    updatePropertySchema,
};