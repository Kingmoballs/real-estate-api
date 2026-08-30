const Joi = require("joi");

const emailSchema = Joi.string()
    .trim()
    .lowercase()
    .email();

const strongPasswordSchema = Joi.string()
    .min(12)
    .max(128)
    .pattern(/[a-z]/, "lowercase letter")
    .pattern(/[A-Z]/, "uppercase letter")
    .pattern(/[0-9]/, "number")
    .pattern(/[^A-Za-z0-9]/, "special character")
    .messages({
        "string.min":
            "Password must contain at least 12 characters",
        "string.pattern.name":
            "Password must contain at least one {#name}",
    });

const registerSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required(),
    email: emailSchema.required(),
    password: strongPasswordSchema.required(),
    phone: Joi.string()
        .trim()
        .min(7)
        .max(20)
        .required(),
});

const loginSchema = Joi.object({
    email: emailSchema.required(),
    password: Joi.string().max(128).required(),
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().max(128).required(),
    newPassword: strongPasswordSchema.required(),
});

const forgotPasswordSchema = Joi.object({
    email: emailSchema.required(),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().hex().length(64).required(),
    newPassword: strongPasswordSchema.required(),
});

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};
