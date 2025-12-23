const Message = require("../models/Message");
const Property = require("../models/Property");

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { propertyId, content } = req.body;

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        const message = new Message({
            property: property._id,
            agent: property.postedBy,
            sender: req.user.id,    
            senderName: req.user.name,
            senderEmail: req.user.email,
            content,
        });

        const savedMessage = await message.save();
        res.status(201).json(savedMessage);

    } catch (err) {
        console.error("Send message error:", err);
        res.status(500).json({ message: "Failed to send message" });
    }
};


// Get all messages for an Agent

exports.getMessagesForAgent = async(req, res) => {
    try{
        const messages = await Message.find({ agent: req.user.id }).populate("property", "title");
        res.status(200).json(messages)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Get all messages sent by a user
exports.getMessagesByUserEmail = async(req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ message: "Email is required" })
    }

    try {
        const messages = await Message.find({ senderEmail: email }).sort({ createdAt: -1 });
        res.status(200).json(messages)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Reply to messages sent by user
exports.replyToMessage = async(req, res) => {
    const { messageId } = req.params;
    const { reply } = req.body;

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" })
        }

        if (message.agent.toString() !== req.user.id) {
            res.status(404).json({ message: "Unauthorized to reply to this message" })
        }

        message.reply = reply;
        message.isReplied = true;
        await message.save();

        res.status(200).json({ message: "Message sent", data: message })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

//Get unread messages sent by user

exports.getUnreadMessagesForAgent = async(req, res) => {
    try {
        const unreadMessages = await Message.find({
            agent: req.user.id,
            isRead: false,
        })
        .populate(("property", "tilte"))
        .sort({ createdAt: -1 });

        res.status(200).json(unreadMessages)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// Mark opened message as read

exports.markMessageAsRead = async(req, res) => {
    const { messageId } = req.params;

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            res.status(404).json({ message: "Message not found" })
        }
        if (message.agent.toString() !== req.user.id) {
            res.status(404).json({ message: "Unauthorized" })
        }

        message.isRead = true;
        await message.save()

        res.status(200).json({ message: "Mark as read" })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

//Delete a message

exports.deleteMessage = async(req, res) => {
    try{
        const { messageId } = req.params;
        const userId = req.user.id;
        const message = await Message.findById(messageId)

        if (!message) {
            return res.status(404).json({ message: "Message not found" })
        }

        if (message.sender.toString() !== userId && message.recipient.toString() !== userId) {
            return res.status(404).json({ message: "Unauthorized to delete this message" })
        }

        message.deleted = true;
        await Message.findByIdAndDelete(messageId);
    }
    catch {

    }
}