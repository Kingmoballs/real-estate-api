const Notification = require("./notification.model");

exports.findByUser = async (userId, options = {}) => {
    const { session } = options;

    const query = Notification.find({
        user: userId,
    })
        .populate("conversation")
        .populate("message")
        .populate("booking")
        .populate({
            path: "inspection",
            select: [
                "property",
                "customer",
                "agent",
                "status",
                "requestedFor",
                "scheduledFor",
                "proposedFor",
            ].join(" "),
            populate: {
                path: "property",
                select: [
                    "title",
                    "listingType",
                    "propertyType",
                    "images",
                    "address",
                ].join(" "),
            },
        })
        .populate({
            path: "review",
            select: [
                "property",
                "customer",
                "rating",
                "title",
                "status",
                "agentResponse",
            ].join(" "),
            populate: [
                {
                    path: "property",
                    select: "title listingType propertyType images",
                },
                {
                    path: "customer",
                    select: "name",
                },
            ],
        })
        .sort({ createdAt: -1 });

    if (session) query.session(session);

    return query;
};

exports.markAsRead = async (notificationId, userId, session) => {
    const query = Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true },
        { new: true }
    );

    if (session) query.session(session);

    return query;
};
