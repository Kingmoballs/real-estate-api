const Joi = require("joi");

const registerSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(8).max(128).required(),
    phone: Joi.string().trim().min(7).max(20).required()
});

const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required()
});

module.exports = {
    registerSchema,
    loginSchema
};