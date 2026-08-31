const ApiError = require("@/shared/utils/ApiError");

module.exports = (err, req, res, next) => {
    let error;

    if (err instanceof ApiError) {
        error = err;
    } else if (err.name === "CastError") {
        error = new ApiError(400, "Invalid ID format");
    } else if (err.name === "ValidationError") {
        const details = Object.values(err.errors || {}).map(
            (validationError) => validationError.message
        );
        error = new ApiError(
            400,
            details.join("; ") || "Invalid data"
        );
    } else if (err.code === 11000) {
        error = new ApiError(409, "Duplicate resource");
    } else {
        error = new ApiError(500, "Internal server error");

        if (process.env.NODE_ENV !== "test") {
            console.error("Unhandled API error:", err);
        }
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Something went wrong",
    });
};
