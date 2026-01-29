const express = require("express");
const router = express.Router();
const { 
    sendMessage, 
    getInbox,
    getConversationMessages,
    markConversationAsRead

} = require("../controllers/chatController");
const { sendMessageSchema } = require("../validatiors/messageValidator");
const validate = require("../middleware/validateMiddleware")
const { protect } = require("../middleware/authMiddleware");

router.post("/send", protect, validate(sendMessageSchema), sendMessage);
router.get("/inbox", protect, getInbox);
router.get("/:conversationId", protect, getConversationMessages)
router.patch("/:conversationId/read", protect, markConversationAsRead)


module.exports = router;