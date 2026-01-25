const Notification = require("../models/Notification");

exports.findByUser = async (userId, options = {}) => {
    const { session } = options;

    const query = Notification.find({ user: userId })
        .populate("conversation")
        .populate("message")
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