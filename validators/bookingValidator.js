const Joi = require("joi");

const createBookingSchema = Joi.object({
    property: Joi.string().required(),
    checkInDate: Joi.date().required(),
    checkOutDate: Joi.date().required(),
    message: Joi.string().allow("")
});

module.exports = { createBookingSchema }