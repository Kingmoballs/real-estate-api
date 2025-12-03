const jwt = require("jsonwebtoken");
const User = require("../models/user");

const protect = async (req, res, next) => {
    try {
        let token;

        // Try reading token from cookies
        if (req.cookies?.token) {
            token = req.cookies.token;
        }
        
        // Fallback: Bearer token for Mobile app and Postman
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // 2. If no token, block request
        if (!token) 
            return res.status(401).json({ message: "Not authorized. No token provided" });

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Ensure user still exists
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "User no longer exists." });
        }

        // 5. Grant access
        req.user = user;
        
        next();
    }
    
    catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).json({ message: "Not authorized. Invalid token." });
    }
}

// Only agents can crate property

const requireAgent = async (req, res, next) => {
    if (req.user.role !== "agent") {
        return res.status(403).json({ message: "Only agents can perform this action" })
    }

    next()
}

module.exports = { protect, requireAgent };