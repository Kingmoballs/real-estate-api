const chatService = require("./chat.service");

exports.sendMessage = async (req, res, next) => {
    try {
        const result = await chatService.sendMessage({
            user: req.user,
            propertyId: req.body.propertyId,
            conversationId: req.body.conversationId,
            inquiryType: req.body.inquiryType,
            content: req.body.content,
        });

        res.status(201).json({
            message: "Message sent successfully",
            conversationId: result.conversationId,
            data: result.message,
        });
    } catch (error) {
        next(error);
    }
};

exports.getConversationMessages = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await chatService.getConversationMessages({
                conversationId:
                    req.params.conversationId,
                userId: req.user._id,
                page: req.query.page,
                limit: req.query.limit,
            });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getInbox = async (req, res, next) => {
    try {
        const result = await chatService.getInbox({
            userId: req.user._id,
            status: req.query.status,
            page: req.query.page,
            limit: req.query.limit,
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.markConversationAsRead = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await chatService.markConversationAsRead({
                conversationId:
                    req.params.conversationId,
                userId: req.user._id,
            });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.updateConversationStatus = async (
    req,
    res,
    next
) => {
    try {
        const conversation =
            await chatService.updateConversationStatus({
                conversationId:
                    req.params.conversationId,
                user: req.user,
                status: req.body.status,
            });

        res.status(200).json({
            message:
                `Conversation ${conversation.status} successfully`,
            conversation,
        });
    } catch (error) {
        next(error);
    }
};
