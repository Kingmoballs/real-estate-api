const Conversation = require("./conversation.model");

exports.findById = (conversationId, session = null) => {
    const query = Conversation.findById(conversationId);

    if (session) {
        query.session(session);
    }

    return query;
};

exports.findByIdWithDetails = (conversationId) => {
    return Conversation.findById(conversationId)
        .populate(
            "property",
            "title images listingType propertyType listingStatus price currency pricePeriod"
        )
        .populate("agent", "name email phone")
        .populate("customer", "name email phone")
        .populate("closedBy", "name role")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "name role",
            },
        });
};

exports.findByPropertyAndCustomer = (
    propertyId,
    customerId,
    session = null
) => {
    const query = Conversation.findOne({
        property: propertyId,
        customer: customerId,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

exports.create = async (data, session) => {
    const [conversation] = await Conversation.create(
        [data],
        { session }
    );

    return conversation;
};

exports.updateLastMessage = (
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

exports.findUserInbox = async ({
    userId,
    status,
    page,
    limit,
}) => {
    const filters = {
        participants: userId,
    };

    if (status) {
        filters.status = status;
    }

    const skip = (page - 1) * limit;

    const [conversations, totalItems] =
        await Promise.all([
            Conversation.find(filters)
                .populate(
                    "property",
                    "title images listingType propertyType listingStatus price currency pricePeriod"
                )
                .populate("agent", "name email phone")
                .populate("customer", "name email phone")
                .populate({
                    path: "lastMessage",
                    populate: {
                        path: "sender",
                        select: "name role",
                    },
                })
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),

            Conversation.countDocuments(filters),
        ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
        conversations,
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

exports.save = (conversation, session = null) => {
    if (session) {
        return conversation.save({ session });
    }

    return conversation.save();
};
