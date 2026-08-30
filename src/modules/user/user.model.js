const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        phone: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["admin", "agent", "user"],
            default: "user"
        },

        accountStatus: {
            type: String,
            enum: ["active", "suspended", "deactivated"],
            default: "active",
            index: true
        },

        lastSeen: {
            type: Date,
            default: null
        },

        refreshTokenHash: {
            type: String,
            select: false
        },

        passwordResetTokenHash: {
            type: String,
            select: false
        },

        passwordResetExpiresAt: {
            type: Date,
            select: false
        },

        passwordChangedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model("User", userSchema);
