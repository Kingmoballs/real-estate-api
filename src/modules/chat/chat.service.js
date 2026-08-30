const mongoose = require("mongoose");
const ApiError = require("@/shared/utils/ApiError");
const conversationRepository = require("./conversation.repository");
const chatRepository = require("./chat.repository");
const propertyRepository = require("../property/property.repository");
const eventBus = require("@/shared/events/eventBus");
const EVENTS = require("@/shared/events/eventRegistry");

const validateObjectId = (id, label) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, `Invalid ${label}`);
    }
};

const isParticipant = (conversation, userId) => {
    return conversation.participants.some(
        (participantId) =>
            participantId.toString() === userId.toString()
    );
};

exports.sendMessage = async ({
    user,
    propertyId,
    conversationId,
    inquiryType = "general",
    content,
}) => {
    if (propertyId) {
        validateObjectId(propertyId, "property ID");
    }

    if (conversationId) {
        validateObjectId(
            conversationId,
            "conversation ID"
        );
    }

    if (user.role === "admin" && propertyId) {
        throw new ApiError(
            403,
            "Platform administrators cannot start property inquiries"
        );
    }

    const session = await mongoose.startSession();

    let conversation;
    let message;
    let recipientId;

    try {
        await session.withTransaction(async () => {
            if (conversationId) {
                conversation =
                    await conversationRepository.findById(
                        conversationId,
                        session
                    );

                if (!conversation) {
                    throw new ApiError(
                        404,
                        "Conversation not found"
                    );
                }

                if (
                    !isParticipant(
                        conversation,
                        user._id
                    )
                ) {
                    throw new ApiError(
                        403,
                        "You are not a participant in this conversation"
                    );
                }
            } else {
                const property =
                    await propertyRepository.findById(
                        propertyId,
                        session
                    );

                if (!property) {
                    throw new ApiError(
                        404,
                        "Property not found"
                    );
                }

                if (
                    property.listingStatus !==
                    "published"
                ) {
                    throw new ApiError(
                        409,
                        "Inquiries can only be started for published properties"
                    );
                }

                if (
                    property.postedBy.toString() ===
                    user._id.toString()
                ) {
                    throw new ApiError(
                        409,
                        "You cannot send an inquiry about your own property"
                    );
                }

                conversation =
                    await conversationRepository
                        .findByPropertyAndCustomer(
                            property._id,
                            user._id,
                            session
                        );

                if (!conversation) {
                    conversation =
                        await conversationRepository.create(
                            {
                                property: property._id,
                                agent: property.postedBy,
                                customer: user._id,
                                participants: [
                                    user._id,
                                    property.postedBy,
                                ],
                                inquiryType,
                                status: "open",
                            },
                            session
                        );
                }
            }

            if (conversation.status === "closed") {
                throw new ApiError(
                    409,
                    "This property inquiry is closed"
                );
            }

            message = await chatRepository.createMessage(
                {
                    conversation: conversation._id,
                    sender: user._id,
                    content,
                    readBy: [user._id],
                },
                session
            );

            await conversationRepository.updateLastMessage(
                conversation._id,
                message._id,
                session
            );

            recipientId = conversation.participants.find(
                (participantId) =>
                    participantId.toString() !==
                    user._id.toString()
            );

            if (!recipientId) {
                throw new ApiError(
                    500,
                    "Conversation recipient could not be determined"
                );
            }
        });

        eventBus.emit(EVENTS.MESSAGE_SENT, {
            recipientId,
            conversationId: conversation._id,
            messageId: message._id,
            markDelivered: async () => {
                await chatRepository.markDelivered(
                    message._id,
                    recipientId
                );
            },
        });

        return {
            conversationId: conversation._id,
            message,
        };
    } finally {
        await session.endSession();
    }
};

exports.getConversationMessages = async ({
    conversationId,
    userId,
    page = 1,
    limit = 50,
}) => {
    validateObjectId(
        conversationId,
        "conversation ID"
    );

    const conversation =
        await conversationRepository.findById(
            conversationId
        );

    if (!conversation) {
        throw new ApiError(
            404,
            "Conversation not found"
        );
    }

    if (!isParticipant(conversation, userId)) {
        throw new ApiError(
            403,
            "You are not authorized to view this conversation"
        );
    }

    return chatRepository.findByConversationId({
        conversationId,
        page: Number(page),
        limit: Number(limit),
    });
};

exports.getInbox = async ({
    userId,
    status,
    page = 1,
    limit = 20,
}) => {
    const result =
        await conversationRepository.findUserInbox({
            userId,
            status,
            page: Number(page),
            limit: Number(limit),
        });

    const conversations = await Promise.all(
        result.conversations.map(
            async (conversation) => {
                const unreadCount =
                    await chatRepository
                        .countUnreadMessages(
                            conversation._id,
                            userId
                        );

                return {
                    ...conversation.toObject(),
                    unreadCount,
                };
            }
        )
    );

    return {
        conversations,
        pagination: result.pagination,
    };
};

exports.markConversationAsRead = async ({
    conversationId,
    userId,
}) => {
    validateObjectId(
        conversationId,
        "conversation ID"
    );

    const conversation =
        await conversationRepository.findById(
            conversationId
        );

    if (!conversation) {
        throw new ApiError(
            404,
            "Conversation not found"
        );
    }

    if (!isParticipant(conversation, userId)) {
        throw new ApiError(
            403,
            "You are not authorized to update this conversation"
        );
    }

    await chatRepository.markMessagesAsRead(
        conversationId,
        userId
    );

    return {
        message: "Conversation marked as read",
    };
};

exports.updateConversationStatus = async ({
    conversationId,
    user,
    status,
}) => {
    validateObjectId(
        conversationId,
        "conversation ID"
    );

    const conversation =
        await conversationRepository.findById(
            conversationId
        );

    if (!conversation) {
        throw new ApiError(
            404,
            "Conversation not found"
        );
    }

    if (
        conversation.agent.toString() !==
        user._id.toString()
    ) {
        throw new ApiError(
            403,
            "Only the property owner can manage this inquiry"
        );
    }

    if (conversation.status === status) {
        throw new ApiError(
            409,
            `Conversation is already ${status}`
        );
    }

    conversation.status = status;

    if (status === "closed") {
        conversation.closedAt = new Date();
        conversation.closedBy = user._id;
    } else {
        conversation.closedAt = null;
        conversation.closedBy = null;
    }

    await conversationRepository.save(conversation);

    return conversationRepository
        .findByIdWithDetails(conversationId);
};
