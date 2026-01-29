const Joi = require("joi");

const sendMessageSchema = Joi.object({
    propertyId: Joi.string(),
    conversationId: Joi.string(),
    content: Joi.string().min(3).required()
})
    .xor("propertyId", "conversationId") // one or the other, not both
    .messages({
        "object.missing": "Either propertyId or conversationId is required",
        "object.xor": "Provide either propertyId or conversationId, not both"
    });

module.exports = { sendMessageSchema };
