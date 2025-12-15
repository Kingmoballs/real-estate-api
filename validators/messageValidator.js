const Joi = require("joi");

const sendMessageSchema = Joi.object({
    propertyId: Joi.string().required(),
    content: Joi.string().min(3).required()
})

module.exports = { sendMessageSchema }