const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true }
            }
        ],
        bedrooms: {
            type: Number,
            default: 0
        },
        bathrooms: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: function() {
                return this.propertyType === "sale";
            },
        },
        propertyType: {
            type: String,
            required: true,
        },
        dailyRate: {
            type: Number,
            required: function() {
                return this.propertyType === "serviced";
            },
        },
        agentName: {
            type: String,
            required: true,
        },
        agentPhone: {
            type: String,
            require: true,
        },
        agentEmail: {
            type: String,
            required: true
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "User",
            required: true
        }
    },
    {timestamps: true}
);

const Property = mongoose.model("Property", propertySchema);
module.exports = Property;