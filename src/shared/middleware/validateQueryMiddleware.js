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

        req.query = value;

        next();
    };
};

module.exports = validateQuery;