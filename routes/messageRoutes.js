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
const authenticateUser = require("../middleware/authMiddleware");

router.post("/send", authenticateUser, sendMessage);
router.get("/inbox", authenticateUser, getMessagesForAgent);
router.get("/user-inbox", authenticateUser, getMessagesByUserEmail);
router.post("/reply/:messageId", authenticateUser, replyToMessage) ;
router.patch("/mark-read/:messageId", authenticateUser, markMessageAsRead);
router.get("/notifications/unread", authenticateUser, getUnreadMessagesForAgent);
router.delete("/messages/:messageId", authenticateUser, deleteMessage)

module.exports = router;