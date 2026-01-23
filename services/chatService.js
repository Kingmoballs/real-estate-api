const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const conversationRepository = require("../repositories/conversationRepository");
const chatRepository = require("../repositories/chatRepository");
const propertyRepository = require("../repositories/propertyRepository");
const NotificationService = require("../services/notificationService");

// Send a message
exports.sendMessage = async ({ user, propertyId, conversationId, content }) => {
    const session = await mongoose.startSession();

    try {
        if (!content) {
            throw new ApiError(400, "Message content is required");
        }

        if (!propertyId && !conversationId) {
            throw new ApiError(
                400,
                "Either propertyId or conversationId is required"
            );
        }

        session.startTransaction();

        let conversation;

        // Replying to existing conversation
        if (conversationId) {
            conversation = await conversationRepository.findById(
                conversationId,
                session
            );

            if (!conversation) {
                throw new ApiError(404, "Conversation not found");
            }

            // Ensure user is part of conversation
            const isParticipant = conversation.participants.some(
                id => id.toString() === user.id.toString()
            );

            if (!isParticipant) {
                throw new ApiError(403, "Not authorized to send message");
            }
        }

        // New message via property
        if (!conversation && propertyId) {
            const property = await propertyRepository.findById(
                propertyId,
                session
            );

            if (!property) {
                throw new ApiError(404, "Property not found");
            }

            conversation =
                await conversationRepository.findByPropertyAndParticipant(
                    property._id,
                    user.id,
                    session
                );

            if (!conversation) {
                conversation = await conversationRepository.create(
                    {
                        property: property._id,
                        agent: property.postedBy,
                        participants: [user.id, property.postedBy],
                    },
                    session
                );
            }
        }

        // Create message
        const message = await chatRepository.createMessage(
            {
                conversation: conversation._id,
                sender: user.id,
                content,
                readBy: [user.id],
            },
            session
        );

        await conversationRepository.updateLastMessage(
            conversation._id,
            message._id,
            session
        );

        // Determine recipient
        const recipient =
            user.id.toString() === conversation.agent.toString()
                ? conversation.participants.find(
                      id => id.toString() !== user.id.toString()
                  )
                : conversation.agent;

        // Notification
        const notification =
            await NotificationService.createMessageNotification(
                {
                    recipientId: recipient,
                    conversationId: conversation._id,
                    messageId: message._id,
                },
                session
            );

        await session.commitTransaction();
        session.endSession();

        // Socket + delivery (after commit)
        if (notification) {
            NotificationService.emitMessageNotification(notification);
            await chatRepository.markDelivered(message._id, recipient);
        }

        return message;
    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        throw err;
    }
};


// Get conversation messages
exports.getConversationMessages = async (conversationId) => {
    if (!conversationId) {
        throw new ApiError(400, "Conversation ID is required");
    }

    const messages =
        await chatRepository.findByConversationId(conversationId);

    return messages;
};

// Get inbox messages (user or agent)
exports.getInbox = async (userId) => {
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const conversations =
        await conversationRepository.findUserInbox(userId);

    const inboxWithUnread = await Promise.all(
        conversations.map(async (conversation) => {
            const unreadCount =
                await chatRepository.countUnreadMessages(
                    conversation._id,
                    userId
                );

            return {
                ...conversation.toObject(),
                unreadCount,
            };
        })
    );

    return inboxWithUnread;
};

// Mark conversation as read
exports.markConversationAsRead = async ({ conversationId, userId }) => {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
        throw new ApiError(404, "Conversation not found");
    }

    if (!conversation.participants.includes(userId)) {
        throw new ApiError(403, "Not authorized");
    }

    await chatRepository.markMessagesAsRead(conversationId, userId);

    return { message: "Messages marked as read" };
};
