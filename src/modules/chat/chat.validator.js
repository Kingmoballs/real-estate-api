const Joi = require("joi");

const sendMessageSchema = Joi.object({
    propertyId: Joi.string().hex().length(24),
    conversationId: Joi.string().hex().length(24),
    inquiryType: Joi.when("propertyId", {
        is: Joi.exist(),
        then: Joi.string()
            .valid("general", "availability", "viewing", "price")
            .default("general"),
        otherwise: Joi.forbidden(),
    }),
    content: Joi.string().trim().min(3).max(2000).required()
})
    .xor("propertyId", "conversationId") // one or the other, not both
    .messages({
        "object.missing": "Either propertyId or conversationId is required",
        "object.xor": "Provide either propertyId or conversationId, not both"
    });

const conversationQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid("open", "closed").optional(),
});

const messageQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
});

const updateConversationStatusSchema = Joi.object({
    status: Joi.string().valid("open", "closed").required(),
});

module.exports = {
    sendMessageSchema,
    conversationQuerySchema,
    messageQuerySchema,
    updateConversationStatusSchema,
};
