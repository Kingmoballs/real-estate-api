const Joi = require("joi");

const submitAgentApplicationSchema = Joi.object({
    businessType: Joi.string()
        .lowercase()
        .valid("individual", "company")
        .required(),

    businessName: Joi.string()
        .trim()
        .min(2)
        .max(150)
        .required(),

    registrationNumber: Joi.when("businessType", {
        is: "company",
        then: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required(),
        otherwise: Joi.string()
            .trim()
            .max(100)
            .allow("", null)
            .optional(),
    }),

    yearsOfExperience: Joi.number()
        .integer()
        .min(0)
        .max(70)
        .default(0),

    serviceAreas: Joi.array()
        .items(
            Joi.string()
                .trim()
                .min(2)
                .max(100)
                .required()
        )
        .min(1)
        .max(20)
        .unique()
        .required(),

    officeAddress: Joi.string()
        .trim()
        .min(5)
        .max(300)
        .required(),

    bio: Joi.string()
        .trim()
        .min(30)
        .max(1000)
        .required(),
});

const listAgentApplicationsQuerySchema = Joi.object({
    status: Joi.string()
        .valid("pending", "approved", "rejected")
        .optional(),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20),
});

const rejectAgentApplicationSchema = Joi.object({
    reason: Joi.string()
        .trim()
        .min(10)
        .max(500)
        .required(),
});

module.exports = {
    submitAgentApplicationSchema,
    listAgentApplicationsQuerySchema,
    rejectAgentApplicationSchema,
};