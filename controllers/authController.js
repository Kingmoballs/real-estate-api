const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const authService = require("../services/authService")

const generateToken = (userId)  => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
};

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
exports.login = async (req, res) => {
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
        res.status(err.statusCode || 500).json({
            message: err.message || "Login failed"
        });
    }
};


exports.refreshToken = async (req, res) => {
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
        res.status(err.statusCode || 500).json({
            message: err.message || "Failed to refresh token"
        });
    }
};


exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        await authService.logout({ refreshToken });

        res.clearCookie("token", { path: "/" });
        res.clearCookie("refreshToken", {
            path: "/api/auth/refresh-token"
        });

        res.status(200).json({ message: "Logged out successfully" });

    } catch (err) {
        res.status(500).json({
            message: "Logout failed"
        });
    }
};