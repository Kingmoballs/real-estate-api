const chatService = require("../services/chatService");

// Send a message
exports.sendMessage = async (req, res, next) => {
    try {
        const message = await chatService.sendMessage({
            user: req.user,
            propertyId: req.body.propertyId,
            conversationId: req.body.conversationId,
            content: req.body.content,
        });

        res.status(201).json(message);
    } catch (err) {
        next(err);
    }
};


// Get conversation messages
exports.getConversationMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;

        const messages = await chatService.getConversationMessages(conversationId);

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages,
        });
    } catch (err) {
        next(err); 
    }
};

// Get inbox messages (user or agent)
exports.getInbox = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const inbox = await chatService.getInbox(userId);

        res.status(200).json({
            success: true,
            count: inbox.length,
            data: inbox,
        });
    } catch (err) {
        next(err);
    }
};

// Mark message as read
exports.markConversationAsRead = async (req, res,next) => {
    try {
        const result = await chatService.markConversationAsRead({
            conversationId: req.params.conversationId,
            userId: req.user.id,
        });

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};
