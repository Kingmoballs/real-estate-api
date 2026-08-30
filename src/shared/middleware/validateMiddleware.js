const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            convert: true,
        });

        if (error) {
            return res.status(400).json({
                message: "Validation error",
                details: error.details.map(err => err.message),
            });
        }

        // Use Joi's trimmed, normalized and type-converted payload.
        req.body = value;

        next();
    };
};

module.exports = validate;
