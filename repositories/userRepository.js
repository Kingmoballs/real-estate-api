const User = require("../models/user");

exports.findByEmail = (email) => {
    return User.findOne({ email });
}

exports.findByEmailWithPassword = (email) => {
    return User.findOne({ email }).select("+password +refreshToken");
};

exports.findById = (id) => {
    return User.findById(id);
};

exports.findByRefreshToken = (refreshToken) => {
    return User.findOne({ refreshToken });
};

exports.save = (user) => {
    return user.save();
};

exports.createUser = (data) => {
    return User.create(data);
}