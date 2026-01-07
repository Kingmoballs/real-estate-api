const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getNotifications,
    markAsRead,
    getUnreadCount
} = require("../controllers/notificationController");

router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markAsRead);
router.get("/unread-count", protect, getUnreadCount);

module.exports = router;