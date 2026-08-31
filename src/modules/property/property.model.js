const mongoose = require("mongoose");
const {
    AMENITIES,
    FURNISHING_STATUSES,
    SIZE_UNITS,
} = require("./property.constants");

const PRICE_PERIODS_BY_LISTING_TYPE = {
    shortlet: ["night"],
    rent: ["month", "year"],
    sale: ["total"],
};

const addressSchema = new mongoose.Schema(
    {
        streetAddress: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },
        city: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },
        state: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },
        lga: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },
        country: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "Nigeria",
        },
        postalCode: {
            type: String,
            trim: true,
            maxlength: 20,
            default: "",
        },
    },
    { _id: false }
);

const geoPointSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator(value) {
                    return (
                        value.length === 2 &&
                        value[0] >= -180 &&
                        value[0] <= 180 &&
                        value[1] >= -90 &&
                        value[1] <= 90
                    );
                },
                message:
                    "Coordinates must contain [longitude, latitude]",
            },
        },
    },
    { _id: false }
);

const propertySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        // Retained as a human-readable value for legacy clients and text
        // search. New listings can derive it from the structured address.
        location: {
            type: String,
            trim: true,
            maxlength: 300,
        },
        address: {
            type: addressSchema,
            default: () => ({}),
        },
        // Keep the entire GeoJSON field absent when coordinates are not
        // supplied. An empty object is invalid for a 2dsphere index.
        geoLocation: {
            type: geoPointSchema,
            default: undefined,
        },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],
        bedrooms: {
            type: Number,
            default: 0,
            min: 0,
        },
        bathrooms: {
            type: Number,
            default: 0,
            min: 0,
        },
        furnishingStatus: {
            type: String,
            enum: FURNISHING_STATUSES,
            default: "unfurnished",
            index: true,
        },
        amenities: {
            type: [String],
            enum: AMENITIES,
            default: [],
        },
        size: {
            value: {
                type: Number,
                min: 0,
                default: null,
            },
            unit: {
                type: String,
                enum: SIZE_UNITS,
                default: "sqm",
            },
        },
        parkingSpaces: {
            type: Number,
            min: 0,
            default: 0,
        },
        yearBuilt: {
            type: Number,
            min: 1800,
            max: new Date().getFullYear() + 1,
            default: null,
        },
        listingType: {
            type: String,
            enum: ["shortlet", "rent", "sale"],
            required: true,
            index: true,
        },
        propertyType: {
            type: String,
            enum: [
                "apartment",
                "house",
                "duplex",
                "bungalow",
                "land",
                "commercial",
                "office",
                "shop",
                "warehouse",
            ],
            required: true,
            index: true,
        },
        price: {
            type: Number,
            required: true,
            min: 1,
            index: true,
        },
        currency: {
            type: String,
            enum: ["NGN", "USD"],
            default: "NGN",
            uppercase: true,
            trim: true,
        },
        pricePeriod: {
            type: String,
            enum: ["night", "month", "year", "total"],
            required: true,
        },
        serviceCharge: {
            type: Number,
            min: 0,
            default: 0,
        },
        securityDeposit: {
            type: Number,
            min: 0,
            default: 0,
        },
        cleaningFee: {
            type: Number,
            min: 0,
            default: 0,
        },
        listingStatus: {
            type: String,
            enum: [
                "draft",
                "pendingReview",
                "published",
                "rejected",
                "unavailable",
                "rented",
                "sold",
                "archived",
            ],
            default: "pendingReview",
            index: true,
        },
        ratingAverage: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        reviewCount: {
            type: Number,
            min: 0,
            default: 0,
        },
        submittedForReviewAt: {
            type: Date,
            default: Date.now,
        },
        reviewedAt: { type: Date, default: null },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },
        publishedAt: { type: Date, default: null },
        archivedAt: { type: Date, default: null },
        unavailableAt: { type: Date, default: null },
        rentedAt: { type: Date, default: null },
        soldAt: { type: Date, default: null },
        statusChangedAt: { type: Date, default: Date.now },
        agentName: { type: String, required: true },
        agentPhone: { type: String, required: true },
        agentEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

propertySchema.pre("validate", function () {
    if (!this.location && this.address) {
        this.location = [
            this.address.streetAddress,
            this.address.lga,
            this.address.city,
            this.address.state,
            this.address.country,
        ]
            .filter(Boolean)
            .join(", ");
    }

    if (!this.location) {
        this.invalidate(
            "location",
            "A display location or structured address is required"
        );
    }

    const allowedPeriods =
        PRICE_PERIODS_BY_LISTING_TYPE[this.listingType];

    if (
        allowedPeriods &&
        !allowedPeriods.includes(this.pricePeriod)
    ) {
        this.invalidate(
            "pricePeriod",
            `${this.pricePeriod} is not valid for a ${this.listingType} listing`
        );
    }
});

propertySchema.index({
    listingStatus: 1,
    listingType: 1,
    propertyType: 1,
    price: 1,
});
propertySchema.index({
    "address.country": 1,
    "address.state": 1,
    "address.city": 1,
    listingStatus: 1,
});
propertySchema.index({ geoLocation: "2dsphere" });
propertySchema.index({ ratingAverage: -1, reviewCount: -1 });
propertySchema.index({
    title: "text",
    description: "text",
    location: "text",
});

module.exports = mongoose.model("Property", propertySchema);
