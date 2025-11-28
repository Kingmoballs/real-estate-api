const rateLimit = require("express-rate-limit");

// General rate limiter for the whole api
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: {
        status: "error",
        message: "Too many requests from this IP, try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// More strict limit for sensitive routes
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: {
        status: "error",
        message: "Too many login attempts, please slow down"
    }
});

module.exports = { apiLimiter, authLimiter }