const Conversation = require("../models/Conversation");

// Find conversation by ID
exports.findById = async (conversationId) => {
  return Conversation.findById(conversationId);
};

// Find conversation by property ID and participant user ID
exports.findByPropertyAndParticipant = async (
    propertyId,
    userId,
    session
) => {
    return Conversation.findOne({
        property: propertyId,
        participants: { $in: [userId] },
    }).session(session);
};

// Create new conversation
exports.create = async (data, session) => {
    return Conversation.create([data], { session })
        .then(res => res[0]);
};

// Update last message in conversation
exports.updateLastMessage = async (
    conversationId,
    messageId,
    session
) => {
    return Conversation.findByIdAndUpdate(
        conversationId,
        { lastMessage: messageId },
        { session, new: true }
    );
};

// Find user inbox conversations
exports.findUserInbox = async (userId) => {
    return Conversation.find({
        participants: userId,
    })
        .populate("property", "title")
        .populate("lastMessage")
        .sort({ updatedAt: -1 });
};
