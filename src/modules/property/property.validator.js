const Joi = require("joi");
const {
    AMENITIES,
    FURNISHING_STATUSES,
    SIZE_UNITS,
} = require("./property.constants");

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
const propertyTypeSchema = Joi.string().valid(...propertyTypes);

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

const amenitiesSchema = Joi.array()
    .items(Joi.string().valid(...AMENITIES))
    .unique()
    .max(AMENITIES.length);

const addressFields = {
    location: Joi.string().trim().min(2).max(300),
    streetAddress: Joi.string().trim().max(200).allow(""),
    city: Joi.string().trim().min(2).max(100),
    state: Joi.string().trim().min(2).max(100),
    lga: Joi.string().trim().max(100).allow(""),
    country: Joi.string().trim().min(2).max(100),
    postalCode: Joi.string().trim().max(20).allow(""),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
};

const optionalDetailFields = {
    bedrooms: Joi.number().integer().min(0),
    bathrooms: Joi.number().integer().min(0),
    furnishingStatus: Joi.string().valid(
        ...FURNISHING_STATUSES
    ),
    amenities: amenitiesSchema,
    sizeValue: Joi.number().positive(),
    sizeUnit: Joi.string().valid(...SIZE_UNITS),
    parkingSpaces: Joi.number().integer().min(0),
    yearBuilt: Joi.number()
        .integer()
        .min(1800)
        .max(new Date().getFullYear() + 1),
    serviceCharge: Joi.number().min(0),
    securityDeposit: Joi.number().min(0),
    cleaningFee: Joi.number().min(0),
};

const applyFieldRelationships = (schema, { requireLocation }) => {
    let result = schema
        .and("latitude", "longitude")
        .and("sizeValue", "sizeUnit")
        .with("city", ["state", "country"]);

    if (requireLocation) {
        result = result.or("location", "city");
    }

    return result;
};

const createPropertySchema = applyFieldRelationships(
    Joi.object({
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
        ...addressFields,
        country: addressFields.country.default("Nigeria"),
        listingType: listingTypeSchema.required(),
        propertyType: propertyTypeSchema.required(),
        price: Joi.number().positive().required(),
        currency: Joi.string()
            .uppercase()
            .valid("NGN", "USD")
            .default("NGN"),
        pricePeriod: pricePeriodSchema,
        bedrooms: optionalDetailFields.bedrooms.default(0),
        bathrooms: optionalDetailFields.bathrooms.default(0),
        furnishingStatus:
            optionalDetailFields.furnishingStatus.default(
                "unfurnished"
            ),
        amenities: amenitiesSchema.default([]),
        sizeValue: optionalDetailFields.sizeValue,
        sizeUnit: optionalDetailFields.sizeUnit,
        parkingSpaces:
            optionalDetailFields.parkingSpaces.default(0),
        yearBuilt: optionalDetailFields.yearBuilt,
        serviceCharge:
            optionalDetailFields.serviceCharge.default(0),
        securityDeposit:
            optionalDetailFields.securityDeposit.default(0),
        cleaningFee:
            optionalDetailFields.cleaningFee.default(0),
        submissionAction: Joi.string()
            .valid("draft", "submit")
            .default("submit"),
    }),
    { requireLocation: true }
);

const updatePropertySchema = applyFieldRelationships(
    Joi.object({
        title: Joi.string().trim().min(3).max(200),
        description: Joi.string()
            .trim()
            .min(10)
            .max(5000),
        ...addressFields,
        listingType: listingTypeSchema,
        propertyType: propertyTypeSchema,
        price: Joi.number().positive(),
        currency: Joi.string()
            .uppercase()
            .valid("NGN", "USD"),
        pricePeriod: Joi.string().valid(
            "night",
            "month",
            "year",
            "total"
        ),
        ...optionalDetailFields,
    }).min(1),
    { requireLocation: false }
);

const commaSeparatedAmenities = Joi.any().custom(
    (value, helpers) => {
        const values = Array.isArray(value)
            ? value
            : String(value)
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean);

        const invalid = values.find(
            (amenity) => !AMENITIES.includes(amenity)
        );

        if (invalid) {
            return helpers.message({
                custom: `Unsupported amenity: ${invalid}`,
            });
        }

        return [...new Set(values)];
    }
);

const publicPropertyQuerySchema = Joi.object({
    listingType: listingTypeSchema,
    propertyType: propertyTypeSchema,
    pricePeriod: Joi.string().valid(
        "night",
        "month",
        "year",
        "total"
    ),
    currency: Joi.string()
        .uppercase()
        .valid("NGN", "USD"),
    search: Joi.string().trim().max(100),
    location: Joi.string().trim().max(200),
    city: Joi.string().trim().max(100),
    state: Joi.string().trim().max(100),
    lga: Joi.string().trim().max(100),
    country: Joi.string().trim().max(100),
    amenities: commaSeparatedAmenities,
    furnishingStatus: Joi.string().valid(
        ...FURNISHING_STATUSES
    ),
    sizeUnit: Joi.string().valid(...SIZE_UNITS),
    minSize: Joi.number().min(0),
    maxSize: Joi.number().min(0),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    bedrooms: Joi.number().integer().min(0),
    bathrooms: Joi.number().integer().min(0),
    parkingSpaces: Joi.number().integer().min(0),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    radiusKm: Joi.number().positive().max(200),
    sort: Joi.string()
        .valid("newest", "priceAsc", "priceDesc", "topRated")
        .default("newest"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20),
})
    .and("latitude", "longitude", "radiusKm")
    .custom((value, helpers) => {
        if (
            value.minPrice !== undefined &&
            value.maxPrice !== undefined &&
            value.minPrice > value.maxPrice
        ) {
            return helpers.message({
                custom: "minPrice cannot be greater than maxPrice",
            });
        }

        if (
            value.minSize !== undefined &&
            value.maxSize !== undefined &&
            value.minSize > value.maxSize
        ) {
            return helpers.message({
                custom: "minSize cannot be greater than maxSize",
            });
        }

        return value;
    });

const ownedPropertyQuerySchema = Joi.object({
    status: Joi.string().valid(...listingStatuses),
    listingType: listingTypeSchema,
    propertyType: propertyTypeSchema,
    city: Joi.string().trim().max(100),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20),
});

const adminPropertyQuerySchema = Joi.object({
    status: Joi.string().valid(...listingStatuses),
    listingType: listingTypeSchema,
    propertyType: propertyTypeSchema,
    city: Joi.string().trim().max(100),
    state: Joi.string().trim().max(100),
    page: Joi.number().integer().min(1).default(1),
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
        .valid("published", "unavailable", "rented", "sold")
        .required(),
});

module.exports = {
    createPropertySchema,
    updatePropertySchema,
    publicPropertyQuerySchema,
    ownedPropertyQuerySchema,
    adminPropertyQuerySchema,
    rejectPropertySchema,
    updatePropertyStatusSchema,
};
