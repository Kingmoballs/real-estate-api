const authService = require("./auth.service")

// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
    try{
        const result = await authService.register(req.body);
        res.status(201).json(result)
    }
    catch (err) {
        next(err)
    }
}

// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const { user, accessToken, refreshToken } = await authService.login({ email, password });

        // Access token cookie
        res.cookie("token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 15 * 60 * 1000
        });

        // Refresh token cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        next(err)
    }
};

// @route   POST /api/auth/refresh-token
exports.refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        const {
            accessToken,
            refreshToken: newRefreshToken
        } = await authService.refreshToken({ refreshToken });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api/auth/refresh-token"
        });

        res.status(200).json({ accessToken });

    } catch (err) {
        next(err)
    }
};

// @route   POST /api/auth/logout
exports.logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        await authService.logout({ refreshToken });

        res.clearCookie("token", { path: "/" });
        res.clearCookie("refreshToken", {
            path: "/api/auth/refresh-token"
        });

        res.status(200).json({ message: "Logged out successfully" });

    } catch (err) {
        next(err)
    }
};