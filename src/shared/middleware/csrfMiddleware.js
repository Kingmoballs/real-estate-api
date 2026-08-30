const crypto = require("crypto");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const PUBLIC_AUTH_PATHS = new Set([
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
]);

const safelyEqual = (first, second) => {
    if (!first || !second) {
        return false;
    }

    const firstBuffer = Buffer.from(first);
    const secondBuffer = Buffer.from(second);

    return (
        firstBuffer.length === secondBuffer.length &&
        crypto.timingSafeEqual(firstBuffer, secondBuffer)
    );
};

const csrfProtection = (req, res, next) => {
    if (
        SAFE_METHODS.has(req.method) ||
        PUBLIC_AUTH_PATHS.has(req.path)
    ) {
        return next();
    }

    // Bearer tokens are explicitly supplied by the client and are not
    // automatically attached by a browser, so they are not vulnerable to
    // cookie-based CSRF.
    if (req.headers.authorization?.startsWith("Bearer ")) {
        return next();
    }

    const usesAuthCookies = Boolean(
        req.cookies?.token || req.cookies?.refreshToken
    );

    if (!usesAuthCookies) {
        return next();
    }

    const cookieToken = req.cookies.csrfToken;
    const headerToken = req.get("x-csrf-token");

    if (!safelyEqual(cookieToken, headerToken)) {
        return res.status(403).json({
            success: false,
            message: "Invalid or missing CSRF token",
        });
    }

    return next();
};

module.exports = csrfProtection;
