const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const hashToken = (token) =>
    crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

const getRequiredSecret = (name) => {
    const secret = process.env[name];

    if (!secret) {
        throw new Error(`${name} is not configured`);
    }

    return secret;
};

const createAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        getRequiredSecret("JWT_SECRET"),
        {
            expiresIn:
                process.env.JWT_ACCESS_EXPIRES_IN || "15m",
            jwtid: crypto.randomUUID(),
        }
    );
};

const createRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: "refresh" },
        getRequiredSecret("REFRESH_TOKEN_SECRET"),
        {
            expiresIn:
                process.env.JWT_REFRESH_EXPIRES_IN || "7d",
            jwtid: crypto.randomUUID(),
        }
    );
};

const verifyRefreshToken = (token) => {
    const decoded = jwt.verify(
        token,
        getRequiredSecret("REFRESH_TOKEN_SECRET")
    );

    if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
    }

    return decoded;
};

const createPasswordResetToken = () => {
    const token = crypto.randomBytes(32).toString("hex");

    return {
        token,
        tokenHash: hashToken(token),
    };
};

module.exports = {
    hashToken,
    createAccessToken,
    createRefreshToken,
    verifyRefreshToken,
    createPasswordResetToken,
};
