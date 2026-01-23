const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },

        agent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        senderName: {
            type: String,
            required: true,
        },

        senderEmail: {
            type: String,
            required: true,
        },

        content: {
            type: String,
            required: true,
        },

        reply: {
            type: String,
            default: "",
        },

        deliveredTo: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        }],

        isReply: {
            type: Boolean,
            default: false,
        },

        isRead: {
            type: Boolean,
            default: false,
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

module.exports = mongoose.model("Message", messageSchema)