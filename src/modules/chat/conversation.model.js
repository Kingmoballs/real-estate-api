const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true
        },
        agent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatMessage",
        },
        inquiryType: {
            type: String,
            enum: ["general", "availability", "viewing", "price"],
            default: "general",
        },
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open",
            index: true,
        },
        closedAt: {
            type: Date,
            default: null,
        },
        closedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        }
    }, 
    { timestamps: true }
);

conversationSchema.index(
    { property: 1, customer: 1 },
    {
        unique: true,
        partialFilterExpression: {
            customer: { $exists: true },
        },
    }
);

conversationSchema.index({
    participants: 1,
    updatedAt: -1,
});

module.exports = mongoose.model("Conversation", conversationSchema)
