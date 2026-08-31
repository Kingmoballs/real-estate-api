const mongoose = require("mongoose");

const savedPropertySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// A user cannot save the same property more than once.
savedPropertySchema.index(
    { user: 1, property: 1 },
    { unique: true }
);

savedPropertySchema.index({
    user: 1,
    createdAt: -1,
});

module.exports = mongoose.model(
    "SavedProperty",
    savedPropertySchema
);