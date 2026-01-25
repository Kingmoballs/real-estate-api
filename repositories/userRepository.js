const User = require("../models/user");

// Find user by email
exports.findByEmail = (email) => {
    return User.findOne({ email });
}

// Find user by email including password and refresh token
exports.findByEmailWithPassword = (email) => {
    return User.findOne({ email }).select("+password +refreshToken");
};

// Find user by ID
exports.findById = (id) => {
    return User.findById(id);
};

// Find user by refresh token
exports.findByRefreshToken = (refreshToken) => {
    return User.findOne({ refreshToken });
};

// Save user document
exports.save = (user) => {
    return user.save();
};

// Create new user
exports.createUser = (data) => {
    return User.create(data);
}

// Find user's last seen by ID
exports.findUserLastSeenById = async (userId) => {
    return User.findById(userId).select("lastSeen");
};