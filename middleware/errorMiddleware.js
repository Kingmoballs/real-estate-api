const logger = require("./logger");

const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || "Internal Server Error";

    // Log full error with stack trace
    logger.error(
        `${message} - ${req.originalUrl} - ${req.method} - ${req.ip}\n${err.stack}`
    );

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};

module.exports = errorHandler;
