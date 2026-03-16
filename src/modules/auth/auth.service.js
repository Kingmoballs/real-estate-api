const userRepository = require("../user/user.repository");
const ApiError = require("@/shared/utils/ApiError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper to generate JWT token
const generateToken = (userId)  => {
    return jwt.sign(
        { id: userId }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" }
    )
};

// Register new user
exports.register = async (payload) => {
    const { name, email, password, phone, role } = payload;

    const existingUser =
        await userRepository.findByEmail(email);

    if (existingUser) {
        throw new ApiError(400, "Email already in use");
    }

    const user =
        await userRepository.createUser({
            name,
            email,
            password,
            phone,
            role,
        });

    const token = generateToken(user._id);

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
        token,
    };
};

// Login user
exports.login = async ({ email, password }) => {
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
        throw new ApiError(400, "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(400, "Invalid credentials");
    }

    const accessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await userRepository.save(user);

    return {
        user,
        accessToken,
        refreshToken
    };
};

// Refresh JWT tokens
exports.refreshToken = async ({ refreshToken }) => {
    if (!refreshToken) {
        throw new ApiError(401, "No refresh token provided");
    }

    let decoded;
    try {
        decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
        );
    } catch (err) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Security check
    if (user.refreshToken !== refreshToken) {
        throw new ApiError(401, "Refresh token mismatch");
    }

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
    await userRepository.save(user);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
};

// Logout user
exports.logout = async ({ refreshToken }) => {
    if (!refreshToken) return;

    const user = await userRepository.findByRefreshToken(refreshToken);

    if (user) {
        user.refreshToken = null;
        await userRepository.save(user);
    }
};