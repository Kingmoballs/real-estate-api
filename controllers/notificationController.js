const notificationService = require("../services/notificationService");

// Get user notifications
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await notificationService.getUserNotifications({
            user: req.user,
        });

        res.status(200).json(notifications);
    } catch (err) {
        next(err);
    }
};

// Mark one notification as read
exports.markAsRead = async (req, res, next) => {
    try {
        const notification =
            await notificationService.markNotificationAsRead({
                notificationId: req.params.id,
                user: req.user,
            });

        res.status(200).json(notification);
    } catch (err) {
        next(err);
    }
};

// Unread count
exports.getUnreadCount = async (req, res, next) => {
    try {
        const unread =
            await notificationService.getUnreadCount({
                userId: req.user.id,
            });

        res.status(200).json({ unread });
    } catch (err) {
        next(err);
    }
};

