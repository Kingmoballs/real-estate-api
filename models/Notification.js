const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true, // fast unread count
        },

        type: {
            type: String,
            enum: [
                "message",
                "property",
                "booking",
                "system"
            ],
            required: true,
        },

        title: {
            type: String,
            default: "",
        },

        body: {
            type: String,
            default: "",
        },

        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
        },

        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatMessage",
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        deleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Notification", notificationSchema);
