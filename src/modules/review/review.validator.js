const Joi = require("joi");

const objectIdSchema = Joi.string().hex().length(24);

const createReviewSchema = Joi.object({
    property: objectIdSchema.required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().trim().max(120).allow("").default(""),
    comment: Joi.string().trim().min(10).max(3000).required(),
});

const updateReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5),
    title: Joi.string().trim().max(120).allow(""),
    comment: Joi.string().trim().min(10).max(3000),
}).min(1);

const agentResponseSchema = Joi.object({
    comment: Joi.string().trim().min(2).max(1500).required(),
});

const moderationSchema = Joi.object({
    status: Joi.string().valid("published", "hidden").required(),
    reason: Joi.when("status", {
        is: "hidden",
        then: Joi.string().trim().min(3).max(500).required(),
        otherwise: Joi.forbidden(),
    }),
});

const publicReviewQuerySchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5),
    sort: Joi.string()
        .valid("newest", "oldest", "highest", "lowest")
        .default("newest"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

const reviewQuerySchema = Joi.object({
    status: Joi.string().valid("published", "hidden"),
    property: objectIdSchema,
    rating: Joi.number().integer().min(1).max(5),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
    createReviewSchema,
    updateReviewSchema,
    agentResponseSchema,
    moderationSchema,
    publicReviewQuerySchema,
    reviewQuerySchema,
};
