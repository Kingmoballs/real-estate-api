const rateLimit = require("express-rate-limit");

const createLimiter = ({ windowMs, max, message, options = {} }) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: "error",
            message,
        },
        skip: () => process.env.NODE_ENV === "test",
        ...options,
    });

const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests from this IP, try again later",
});

const loginLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: "Too many login attempts, please try again later",
    options: { skipSuccessfulRequests: true },
});

const registrationLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Too many registration attempts, please try again later",
});

const passwordResetLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many password reset attempts, please try again later",
});

const refreshTokenLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: "Too many token refresh attempts, please try again later",
});

module.exports = {
    apiLimiter,
    loginLimiter,
    registrationLimiter,
    passwordResetLimiter,
    refreshTokenLimiter,
};
