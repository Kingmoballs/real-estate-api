const express = require("express");
const router = express.Router();
const { 
    sendMessage, 
    getInbox,
    getConversationMessages,
    markConversationAsRead

} = require("./chat.controller");
const { sendMessageSchema } = require("./chat.validator");
const validate = require("@/shared/middleware/validateMiddleware")
const { protect } = require("@/shared/middleware/authMiddleware");

router.post("/send", protect, validate(sendMessageSchema), sendMessage);
router.get("/inbox", protect, getInbox);
router.get("/:conversationId", protect, getConversationMessages)
router.patch("/:conversationId/read", protect, markConversationAsRead)


module.exports = router;