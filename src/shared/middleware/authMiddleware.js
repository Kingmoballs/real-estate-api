const jwt = require("jsonwebtoken");
const User = require("@/modules/user/user.model");

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.cookies?.token) {
            token = req.cookies.token;
        }

        const authorizationHeader =
            req.headers.authorization;

        if (
            !token &&
            authorizationHeader?.startsWith("Bearer ")
        ) {
            token = authorizationHeader.slice(7).trim();
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