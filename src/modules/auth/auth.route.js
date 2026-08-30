const express = require("express");
const {
    register,
    login,
    refreshToken,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    getCsrfToken,
    getMe,
} = require("./auth.controller");
const { protect } = require("@/shared/middleware/authMiddleware");
const {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require("./auth.validator");
const validate = require("@/shared/middleware/validateMiddleware");
const {
    loginLimiter,
    registrationLimiter,
    passwordResetLimiter,
    refreshTokenLimiter,
} = require("@/shared/middleware/rateLimit");

const router = express.Router();

router.get("/csrf-token", getCsrfToken);

router.post(
    "/register",
    registrationLimiter,
    validate(registerSchema),
    register
);

router.post(
    "/login",
    loginLimiter,
    validate(loginSchema),
    login
);

router.post(
    "/forgot-password",
    passwordResetLimiter,
    validate(forgotPasswordSchema),
    forgotPassword
);

router.post(
    "/reset-password",
    passwordResetLimiter,
    validate(resetPasswordSchema),
    resetPassword
);

router.post(
    "/refresh-token",
    refreshTokenLimiter,
    refreshToken
);

router.post("/logout", logout);

router.patch(
    "/change-password",
    protect,
    validate(changePasswordSchema),
    changePassword
);

router.get("/me", protect, getMe);

module.exports = router;
