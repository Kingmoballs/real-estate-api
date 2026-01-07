const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        deliveredTo: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
        
        createdAt: {
            type: Date,
            default: Date.now,
        },
        
        readAt: {
            type: Date,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema)