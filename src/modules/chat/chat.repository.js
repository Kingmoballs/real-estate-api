const ChatMessage = require("./chatMessage.model");

exports.createMessage = async (data, session) => {
    const [message] = await ChatMessage.create(
        [data],
        { session }
    );

    return message;
};

exports.markDelivered = (messageId, userId) => {
    return ChatMessage.findByIdAndUpdate(
        messageId,
        { $addToSet: { deliveredTo: userId } }
    );
};

exports.findByConversationId = async ({
    conversationId,
    page,
    limit,
}) => {
    const skip = (page - 1) * limit;
    const filters = { conversation: conversationId };

    const [newestFirst, totalItems] =
        await Promise.all([
            ChatMessage.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("sender", "name email role")
                .lean(),

            ChatMessage.countDocuments(filters),
        ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
        // Keep messages chronological inside each page.
        messages: newestFirst.reverse(),
        pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

exports.countUnreadMessages = (
    conversationId,
    userId
) => {
    return ChatMessage.countDocuments({
        conversation: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
    });
};

exports.markMessagesAsRead = (
    conversationId,
    userId
) => {
    return ChatMessage.updateMany(
        {
            conversation: conversationId,
            sender: { $ne: userId },
            readBy: { $ne: userId },
        },
        {
            $addToSet: { readBy: userId },
            $set: { readAt: new Date() },
        }
    );
};
