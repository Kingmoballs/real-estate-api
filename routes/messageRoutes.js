const express = require("express");
const router = express.Router();
const { sendMessage, getMessagesForAgent, getMessagesByUserEmail, replyToMessage } = require("../controllers/messageController");
const authenticateUser = require("../middleware/authMiddleware");

router.post("/send", authenticateUser, sendMessage);
router.get("/inbox", authenticateUser, getMessagesForAgent);
router.get("/user-inbox", authenticateUser, getMessagesByUserEmail);
router.post("/reply/:messageId", authenticateUser, replyToMessage) 

module.exports = router;