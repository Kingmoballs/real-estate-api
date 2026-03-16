const isAgent = (req, res, next) => {
    try{
        if (!req.user) {
            return res.status(401).json({
                message: "Authorization required"
            });
        }

        if (req.user.role !== "agent") {
            return res.status(403).json({
                message: "Access denied. Agent privileges required"
            });
        }

        next();
    }
    catch (err) {
        return res.status(500).json({
            message: "Authorization failed",
            error: err.message
        });
    }
};

module.exports = isAgent