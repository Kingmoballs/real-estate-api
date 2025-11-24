const express = require("express");
const router = express.Router();
const { 
    sendMessage, 
    getMessagesForAgent, 
    getMessagesByUserEmail, 
    replyToMessage,
    markMessageAsRead,
    getUnreadMessagesForAgent,
    deleteMessage

} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const { sendMessageSchema } = require("../validators/messageValidator");
const validate = require("../middleware/validateMiddleware");

router.post("/send", protect, validate(sendMessageSchema),  sendMessage);
router.get("/inbox", protect, getMessagesForAgent);
router.get("/user-inbox", protect, getMessagesByUserEmail);
router.post("/reply/:messageId", protect, replyToMessage) ;
router.patch("/mark-read/:messageId", protect, markMessageAsRead);
router.get("/notifications/unread", protect, getUnreadMessagesForAgent);
router.delete("/messages/:messageId", protect, deleteMessage)

module.exports = router;