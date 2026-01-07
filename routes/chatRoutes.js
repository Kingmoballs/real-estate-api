const express = require("express");
const router = express.Router();
const { 
    sendMessage, 
    getInbox,
    getConversationMessages,
    markConversationAsRead

} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send", protect, sendMessage);
router.get("/inbox", protect, getInbox);
router.get("/:conversationId", protect, getConversationMessages)
router.patch("/:conversationId/read", protect, markConversationAsRead)


module.exports = router;