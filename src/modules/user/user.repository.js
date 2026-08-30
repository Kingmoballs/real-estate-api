const User = require("./user.model");

// Find user by email
exports.findByEmail = (email) => {
    return User.findOne({ email });
}

// Find user by email including authentication secrets
exports.findByEmailWithPassword = (email) => {
    return User.findOne({ email }).select(
        "+password +refreshTokenHash"
    );
};

// Find user by ID
exports.findById = (id, session = null) => {
    const query = User.findById(id);

    if (session) {
        query.session(session);
    }

    return query;
};

// Find user by ID including the stored refresh-token hash
exports.findByIdWithRefreshToken = (id) => {
    return User.findById(id).select("+refreshTokenHash");
};

exports.findByIdWithPassword = (id) => {
    return User.findById(id).select(
        "+password +refreshTokenHash"
    );
};

exports.findByPasswordResetToken = (tokenHash) => {
    return User.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() }
    }).select(
        "+passwordResetTokenHash +passwordResetExpiresAt +refreshTokenHash"
    );
};

// Save user document
exports.save = (user, session = null) => {
    if (session) {
        return user.save({ session });
    }

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
