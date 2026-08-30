const express = require("express");
const {
    sendMessage,
    getInbox,
    getConversationMessages,
    markConversationAsRead,
    updateConversationStatus,
} = require("./chat.controller");
const {
    sendMessageSchema,
    conversationQuerySchema,
    messageQuerySchema,
    updateConversationStatusSchema,
} = require("./chat.validator");
const validate = require("@/shared/middleware/validateMiddleware");
const validateQuery = require("@/shared/middleware/validateQueryMiddleware");
const { protect } = require("@/shared/middleware/authMiddleware");

const router = express.Router();

router.post(
    "/send",
    protect,
    validate(sendMessageSchema),
    sendMessage
);

router.get(
    "/inbox",
    protect,
    validateQuery(conversationQuerySchema),
    getInbox
);

router.patch(
    "/:conversationId/status",
    protect,
    validate(updateConversationStatusSchema),
    updateConversationStatus
);

router.patch(
    "/:conversationId/read",
    protect,
    markConversationAsRead
);

router.get(
    "/:conversationId",
    protect,
    validateQuery(messageQuerySchema),
    getConversationMessages
);

module.exports = router;
