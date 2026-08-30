const crypto = require("crypto");

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const getSameSite = () => {
    const configured = process.env.COOKIE_SAME_SITE?.toLowerCase();

    if (["strict", "lax", "none"].includes(configured)) {
        return configured;
    }

    // Render API + a separately hosted frontend requires SameSite=None.
    return process.env.NODE_ENV === "production" ? "none" : "lax";
};

const getBaseOptions = () => {
    const sameSite = getSameSite();
    const options = {
        secure:
            process.env.NODE_ENV === "production" ||
            sameSite === "none",
        sameSite,
        path: "/",
    };

    if (process.env.COOKIE_DOMAIN) {
        options.domain = process.env.COOKIE_DOMAIN;
    }

    return options;
};

const getAccessCookieOptions = () => ({
    ...getBaseOptions(),
    httpOnly: true,
    maxAge: ACCESS_COOKIE_MAX_AGE,
});

const getRefreshCookieOptions = () => ({
    ...getBaseOptions(),
    httpOnly: true,
    maxAge: REFRESH_COOKIE_MAX_AGE,
});

const getCsrfCookieOptions = () => ({
    ...getBaseOptions(),
    httpOnly: false,
    maxAge: REFRESH_COOKIE_MAX_AGE,
});

const getClearCookieOptions = (httpOnly = true) => ({
    ...getBaseOptions(),
    httpOnly,
});

const createCsrfToken = () =>
    crypto.randomBytes(32).toString("hex");

const setAuthCookies = (
    res,
    { accessToken, refreshToken, csrfToken }
) => {
    res.cookie("token", accessToken, getAccessCookieOptions());
    res.cookie(
        "refreshToken",
        refreshToken,
        getRefreshCookieOptions()
    );
    res.cookie(
        "csrfToken",
        csrfToken,
        getCsrfCookieOptions()
    );
};

const clearAuthCookies = (res) => {
    res.clearCookie("token", getClearCookieOptions(true));
    res.clearCookie(
        "refreshToken",
        getClearCookieOptions(true)
    );
    res.clearCookie(
        "csrfToken",
        getClearCookieOptions(false)
    );
};

module.exports = {
    ACCESS_COOKIE_MAX_AGE,
    REFRESH_COOKIE_MAX_AGE,
    getAccessCookieOptions,
    getRefreshCookieOptions,
    getCsrfCookieOptions,
    getClearCookieOptions,
    createCsrfToken,
    setAuthCookies,
    clearAuthCookies,
};
