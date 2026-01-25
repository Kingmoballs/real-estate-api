const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const { onlineUsers } = require("../utils/onlineUsers");
const userRepository = require("../repositories/userRepository");

exports.getUserStatus = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await userRepository.findUserLastSeenById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const online = onlineUsers.has(userId);

    return {
        userId,
        online,
        lastSeen: online ? null : user.lastSeen
    };
};
