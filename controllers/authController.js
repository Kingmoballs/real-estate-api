const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (userId)  => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
};

// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try{
        const {name, email, password, phone, role} = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({message: "Email already in use"})
        }

        const user = await User.create({ name, email, password, phone, role });
        const token = generateToken(user._id);
        
        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            token
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password +refreshToken");
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Access token
        const accessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        // Refresh token
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        user.refreshToken = refreshToken;
        await user.save();

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
                role: user.role,
            },
            accessToken
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.status(401).json({ message: "Invalid or expired token" });

            const user = await User.findById(decoded.id);
            if (!user) return res.status(404).json({ message: "User not found" });

            const newAccessToken = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: "15m" }
            );

            const newRefreshToken = jwt.sign(
                { id: user._id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: "7d" }
            );

            user.refreshToken = newRefreshToken;
            await user.save();

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: "/api/auth/refresh-token"
            });

            return res.status(200).json({
                accessToken: newAccessToken
            });
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.logout = async(req, res) => {
    try{ 
        res.clearCookie("token", { path: "/" });
        res.clearCookie("refreshToken", { path: "/api/auth/refresh-token" });
        res.status(200).json({ message: "Logged out successfully" })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}