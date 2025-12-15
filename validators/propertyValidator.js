const Joi = require("joi");

const createPropertySchema = Joi.object({
    title: Joi.string().min(3).trim().max(200).required(),
    description: Joi.string().min(10).required(),
    location: Joi.string().required(),
    price: Joi.when("propertyType", {
        is: "sale",
        then: Joi.number().positive().required(),
        otherwise: Joi.forbidden(),
    }),
    propertyType: Joi.string().valid("sale", "serviced").required(),
    bedrooms: Joi.number().integer().min(0),
    bathrooms: Joi.number().integer().min(0),
    
    dailyRate: Joi.when("propertyType", {
        is: "serviced",
        then: Joi.number().positive().required(),
        otherwise: Joi.forbidden(),
    })
});

const updatePropertySchema = Joi.object({
    title: Joi.string().min(3).trim().max(200).required(),
    description: Joi.string().min(10).required(),
    location:Joi.string().required(),
    price: Joi.when("propertyType", {
        is: "sale",
        then: Joi.number().positive().required(),
        otherwise: Joi.forbidden(),
    }),
    propertyType: Joi.string().valid("sale", "serviced").required(),
    bedrooms: Joi.number().integer().min(0),
    bathrooms: Joi.number().integer().min(0),
    dailyRate: Joi.when("propertyType", {
        is: "serviced",
        then: Joi.number().positive().required(),
        otherwise: Joi.forbidden(),
    })

})

module.exports = { createPropertySchema, updatePropertySchema }