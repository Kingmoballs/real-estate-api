const Conversation = require("../models/Conversation");
const ChatMessage = require("../models/ChatMessage");
const Property = require("../models/Property");
const Notification = require("../models/Notification");


// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { propertyId, content } = req.body;
        const io = req.app.get("io");

        if (!content) {
            return res.status(400).json({ message: "Message content is required" });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            property: property._id,
            participants: { $in: [req.user.id] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                property: property._id,
                agent: property.postedBy,
                participants: [req.user.id, property.postedBy],
            });
        }

        // Create message
        const message = await ChatMessage.create({
            conversation: conversation._id,
            sender: req.user.id,
            content,
            readBy: [req.user.id], // sender has read it
        });

        // Update conversation
        conversation.lastMessage = message._id;
        await conversation.save();

        // Emit message to participants
        conversation.participants.forEach(async (userId) => {
            if (userId.toString() !== req.user.id.toString()) {
                io.to(userId.toString()).emit("new_message", {
                    conversationId: conversation._id,
                    message,
                });

                // Mark as delivered
                await ChatMessage.findByIdAndUpdate(message._id, {
                    $addToSet: { deliveredTo: userId }
                });

                io.to(req.user.id.toString()).emit("message_delivered", {
                    messageId: message._id,
                    conversationId: conversation._id
                })

            }
        });

        // Create notification for recipient
        const recipient =
            req.user.id.toString() === conversation.agent.toString()
                ? conversation.participants.find(id => id.toString() !== req.user.id)
                : conversation.agent;

        const notification = await Notification.create({
            user: recipient,
            type: "message",
            conversation: conversation._id,
            message: message._id
        });

        // Real-time notification
        io.to(recipient.toString()).emit("notification", {
            id: notification._id,
            type: "message",
            conversationId: conversation._id,
            message: "New message received"
        })

        res.status(201).json(message);

    } catch (err) {
        console.error("Send message error:", err);
        res.status(500).json({ message: "Failed to send message" });
    }
};


// Get conversation messages
exports.getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const messages = await ChatMessage.find({
            conversation: conversationId,
        })
            .sort({ createdAt: 1 })
            .populate("sender", "name email");
        
        res.status(200).json(messages);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch messages" })
    }
}

// Get inbox messages (user or agent)
exports.getInbox = async (req, res) => {
    try {
        const userId = req.user.id
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("property", "title")
            .populate("lastMessage")
            .sort({ updatedAt: -1 })

        const inboxWithUnread = await Promise.all(
            conversations.map(async (conversation) => {
                const unreadCount = await ChatMessage.countDocuments({
                    conversation: conversation._id,
                    sender: { $ne: userId },
                    readBy: { $ne: userId }
                });

                return ({
                    ...conversation.toObject(),
                    unreadCount
                });
            })
        )

        res.status(200).json(inboxWithUnread);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch inbox" })
    }
}

// Mark message as read
exports.markConversationAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        const io = req.app.get("io");

        // Verify conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" })
        }

        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({ message: "Not authorized" })
        }

        //Mark all unread messages as read
        await ChatMessage.updateMany(
            {
                conversation: conversationId,
                readBy: { $ne: userId }
            },
            {
                $addToSet: { readBy: userId },
            }
        )

        //Notify the other participants (Seen reciept)
        conversation.participants.forEach((participantId) => {
            if (participantId.toString() !== userId.toSting()) {
                io.to(participantId.toString()).emit("message_seen", {
                    conversationId,
                    seenBy: userId,
                });
            }
        });

        res.status(200).json({ message: "Message marked as read" })
    }
    catch (err) {
        console.error("Marked as read error", err);
        res.status(500).json({ message: "Failed to mark as read" });
    }
};
