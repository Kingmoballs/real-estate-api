const Joi = require("joi");

const createPropertySchema = Joi.object({
    title: Joi.string().min(3).required(),
    description: Joi.string().min(10).required(),
    location: Joi.string().required(),
    price: Joi.when("propertyType", {
        is: "sale",
        then: Joi.number().positive().required(),
        otherwise: Joi.forbidden(),
    }),
    propertyType: Joi.string().valid("sale", "service").required(),
    bedrooms: Joi.number().integer().min(0),
    bathrooms: Joi.number().integer().min(0),
    images: Joi.array().items(Joi.string().uri()).min(1).required(),
    dailyRate: Joi.when("propertyType", {
        is: "serviced",
        then: Joi.number().positive().required(),
        otherwise: Joi.forbidden(),
    })
});

const updatePropertySchema = Joi.object({
    title: Joi.string().min(3).required(),
    description: Joi.string().min(10).required(),
    location:Joi.string().required(),
    price: Joi.number().positive().required(),
    propertyType: Joi.string().valid("sale", "service").required(),
    bedrooms: Joi.number().integer().min(0),
    bathrooms: Joi.number().integer().min(0),
    images: Joi.array().items(Joi.string().uri()).min(1).required(),
    dailyRate: Joi.number().positive().required(),

})

module.exports = { createPropertySchema, updatePropertySchema }