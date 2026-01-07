const Notification = require("../models/Notification");

// Get user notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user.id
        })
            .populate("conversation")
            .populate("message")
            .sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};

// Mark one notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isRead: true },
            { new: true }
        );

        res.status(200).json(notification);
    } catch (err) {
        res.status(500).json({ message: "Failed to update notification" });
    }
};

// Unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user.id,
            isRead: false
        });

        res.status(200).json({ unread: count });
    } catch (err) {
        res.status(500).json({ message: "Failed to get unread count" });
    }
};
