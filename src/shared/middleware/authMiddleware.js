const jwt = require("jsonwebtoken");
const User = require("@/modules/user/user.model");

const protect = async (req, res, next) => {
    try {
        let token;

        const authorizationHeader =
            req.headers.authorization;

        if (
            authorizationHeader?.startsWith("Bearer ")
        ) {
            token = authorizationHeader.slice(7).trim();
        }

        if (!token && req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                message:
                    "Not authorized. No token provided",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists",
            });
        }

        if (
            user.accountStatus &&
            user.accountStatus !== "active"
        ) {
            return res.status(403).json({
                message: `This account is ${user.accountStatus}`,
            });
        }

        if (
            user.passwordChangedAt &&
            decoded.iat * 1000 <
                user.passwordChangedAt.getTime()
        ) {
            return res.status(401).json({
                message:
                    "Password changed after this token was issued. Please log in again",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            message:
                "Not authorized. Invalid or expired token",
        });
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action",
            });
        }

        next();
    };
};

module.exports = {
    protect,
    authorizeRoles,
};
