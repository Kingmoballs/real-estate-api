const User = require("../models/user");
const { onlineUsers } = require("../utils/onlineUsers");
const mongoose = require("mongoose");

exports.getUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await User.findById(userId).select("lastSeen");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const online = onlineUsers.has(userId);

        res.status(200).json({
            userId,
            online,
            lastSeen: online ? null : user.lastSeen
        });

    } catch (err) {
        console.error("Get user status error:", err);
        res.status(500).json({ message: "Failed to fetch user status" });
    }
};
