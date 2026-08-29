const multer = require("multer");

module.exports = (
    error,
    req,
    res,
    next
) => {
    if (!error) {
        return next();
    }

    if (error instanceof multer.MulterError) {
        const multerMessages = {
            LIMIT_FILE_SIZE:
                "Each property image must be 5 MB or smaller",

            LIMIT_FILE_COUNT:
                "A maximum of 10 property images is allowed",

            LIMIT_UNEXPECTED_FILE:
                'Unexpected upload field. Use the field name "images"',
        };

        return res.status(400).json({
            message:
                multerMessages[error.code] ||
                error.message,
        });
    }

    return res.status(400).json({
        message:
            error.message ||
            "Property image upload failed",
    });
};