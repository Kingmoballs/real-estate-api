const authService = require("./auth.service");
const {
    createCsrfToken,
    setAuthCookies,
    clearAuthCookies,
    getCsrfCookieOptions,
} = require("@/config/authCookies");

exports.register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { user, accessToken, refreshToken } =
            await authService.login(req.body);
        const csrfToken = createCsrfToken();

        setAuthCookies(res, {
            accessToken,
            refreshToken,
            csrfToken,
        });

        res.status(200).json({
            message: "Login successful",
            user,
            // Returning the access token supports Postman, mobile clients,
            // and frontends that keep it in memory and send Bearer auth.
            accessToken,
            csrfToken,
        });
    } catch (err) {
        next(err);
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const {
            accessToken,
            refreshToken: newRefreshToken,
        } = await authService.refreshToken({ refreshToken });
        const csrfToken = createCsrfToken();

        setAuthCookies(res, {
            accessToken,
            refreshToken: newRefreshToken,
            csrfToken,
        });

        res.status(200).json({ accessToken, csrfToken });
    } catch (err) {
        clearAuthCookies(res);
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        await authService.logout({
            refreshToken: req.cookies.refreshToken,
        });

        clearAuthCookies(res);
        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        clearAuthCookies(res);
        next(err);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        await authService.changePassword({
            userId: req.user._id,
            ...req.body,
        });

        clearAuthCookies(res);
        res.status(200).json({
            message:
                "Password changed successfully. Please log in again.",
        });
    } catch (err) {
        next(err);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        await authService.requestPasswordReset(req.body);

        res.status(200).json({
            message:
                "If an active account exists for that email, password reset instructions have been sent.",
        });
    } catch (err) {
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        await authService.resetPassword(req.body);
        clearAuthCookies(res);

        res.status(200).json({
            message:
                "Password reset successfully. Please log in with your new password.",
        });
    } catch (err) {
        next(err);
    }
};

exports.getCsrfToken = (req, res) => {
    const csrfToken = req.cookies.csrfToken || createCsrfToken();

    res.cookie(
        "csrfToken",
        csrfToken,
        getCsrfCookieOptions()
    );
    res.status(200).json({ csrfToken });
};

exports.getMe = (req, res) => {
    res.status(200).json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone,
            role: req.user.role,
            accountStatus: req.user.accountStatus,
        },
    });
};
