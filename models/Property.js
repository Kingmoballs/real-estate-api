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
        images: {
            type: [String],
            required: true,
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