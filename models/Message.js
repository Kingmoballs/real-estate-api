const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    senderName: String,
    senderEmail: String,
    reply: {
        type: String,
        default: "",
    },
    isReply: {
        type: Boolean,
        default: false,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    content: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now()
    }

})

module.exports = mongoose.model("Message", messageSchema)