const ApiError = require("@/shared/utils/ApiError");

module.exports = (err, req, res, next) => {
    let error = err;

    // Convert unknown errors to ApiError
    if (!(error instanceof ApiError)) {
        error = new ApiError(500, "Internal server error");
    }

    // Invalid Mongo ObjectId
    if (err.name === "CastError") {
        error = new ApiError(400, "Invalid ID format");
    }

    // Duplicate key error
    if (err.code === 11000) {
        error = new ApiError(409, "Duplicate resource");
    }


    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";

    res.status(statusCode).json({
        success: false,
        message
    });
};
