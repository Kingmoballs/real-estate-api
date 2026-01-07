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
        }
    }, 
    { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema)