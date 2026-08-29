const mongoose = require("mongoose");

const PRICE_PERIODS_BY_LISTING_TYPE = {
    shortlet: ["night"],
    rent: ["month", "year"],
    sale: ["total"],
};

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
        location: {
            type: String,
            required: true,
            trim: true,
        },
        images: [
            {
                url: {
                    type: String,
                    required: true,
                },
                public_id: {
                    type: String,
                    required: true,
                },
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

        // Why the property is being listed
        listingType: {
            type: String,
            enum: ["shortlet", "rent", "sale"],
            required: true,
            index: true,
        },

        // What kind of property it is
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

        submittedForReviewAt: {
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
            maxlength: 500,
            default: null,
        },

        publishedAt: {
            type: Date,
            default: null,
        },

        archivedAt: {
            type: Date,
            default: null,
        },

        agentName: {
            type: String,
            required: true,
        },
        agentPhone: {
            type: String,
            required: true,
        },
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
    {
        timestamps: true,
    }
);

propertySchema.pre("validate", function () {
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
    title: "text",
    description: "text",
    location: "text",
});

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;