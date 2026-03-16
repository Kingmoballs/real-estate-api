const ChatMessage = require("./chatMessage.model");

// Create new chat message
exports.createMessage = async (data, session) => {
    return ChatMessage.create([data], { session })
        .then(res => res[0]);
};

// Mark message as delivered
exports.markDelivered = async (messageId, userId) => {
    return ChatMessage.findByIdAndUpdate(
        messageId,
        { $addToSet: { deliveredTo: userId } }
    );
};

// Find messages by conversation ID
exports.findByConversationId = async (conversationId) => {
    return ChatMessage.find({
        conversation: conversationId,
    })
        .sort({ createdAt: 1 })
        .populate("sender", "name email");
};

// Count unread messages for a user in a conversation
exports.countUnreadMessages = async (conversationId, userId) => {
    return ChatMessage.countDocuments({
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
    });
};

// Mark messages as read in a conversation for a user
exports.markMessagesAsRead = async (conversationId, userId) => {
  return ChatMessage.updateMany(
    {
      conversation: conversationId,
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
    }
  );
};