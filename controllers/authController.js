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
    try{
        const {email, password} = req.body;

        const user = await User.findOne({ email }).select("+password +refreshToken")
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        };

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        };
        
        // Grenerate token
        const accesstoken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        // Store refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();

        // Set httpOnly cookies

        // Access token cookie
        res.cookie("token", accesstoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Refresh token cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === " production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        res.status(200).json({
            mesage: "Login successful",
            user: {
                id: user._id,
                email: user.email,
                password:user.password,
                role: user.role
            },
        
        });

    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

exports.refreshToken = async(req, res) => {
    try{
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        // Verify refresh token
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) {
                    return res.status(401).json({ message: "invalid or expired token" });
                }

                //Find the user
                const user = await User.findById(decoded.id);
                if (!user) {
                    res.status(404).json({ message: "User not found" })
                }

                //Issue new access token
                const newAccessToken = jwt.sign(
                    { id: user._id },
                    process.env.JWT_SECRET,
                    { expiresIn: "15m" }
                );

                //Issue a new refresh token
                const newRefreshToken = jwt.sign(
                    { id: user._id },
                    process.env.REFRESH_TOKKEN_SECRET,
                    { expiresIn: "7d" }
                );

                //Set refrehsed token in cookie
                res.cookie("refreshToken", newRefreshToken, {
                    httpOnly: true,
                    sexure: process.env.NODE_ENV == " production",
                    sameSite: "Strict",
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    path: "api/auth/refresh-token"
                });

                return res.status(200).json({
                    accessToken: newAccessToken
                });
            }
        );
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

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