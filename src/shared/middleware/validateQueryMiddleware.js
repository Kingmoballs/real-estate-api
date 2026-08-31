const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(
            req.query,
            {
                abortEarly: false,
                stripUnknown: true,
                convert: true,
            }
        );

        if (error) {
            return res.status(400).json({
                message: "Query validation error",
                details: error.details.map(
                    (detail) => detail.message
                ),
            });
        }

        // Express 5 exposes req.query through a prototype getter. A direct
        // assignment is ignored, so Joi defaults/conversions would be lost.
        Object.defineProperty(req, "query", {
            value,
            configurable: true,
            enumerable: true,
            writable: false,
        });

        next();
    };
};

module.exports = validateQuery;
