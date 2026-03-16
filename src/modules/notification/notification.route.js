const express = require("express");
const router = express.Router();
const { protect } = require("@/shared/middleware/authMiddleware");
const {
    getNotifications,
    markAsRead,
    getUnreadCount
} = require("./notification.controller");

router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markAsRead);
router.get("/unread-count", protect, getUnreadCount);

module.exports = router;