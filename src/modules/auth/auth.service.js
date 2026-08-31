const bcrypt = require("bcryptjs");
const userRepository = require("../user/user.repository");
const ApiError = require("@/shared/utils/ApiError");
const logger = require("@/shared/middleware/logger");
const { sendEmail } = require("@/shared/email/email.service");
const passwordResetTemplate = require(
    "@/shared/email/templates/passwordReset.template"
);
const {
    hashToken,
    createAccessToken,
    createRefreshToken,
    verifyRefreshToken,
    createPasswordResetToken,
} = require("@/shared/utils/authTokens");

const PASSWORD_RESET_MINUTES = 15;

const buildPasswordResetUrl = (token) => {
    const configuredResetUrl =
        process.env.PASSWORD_RESET_URL?.trim();
    const configuredClientUrl = process.env.CLIENT_URL
        ?.split(",")[0]
        ?.trim();

    let resetUrl;

    if (configuredResetUrl) {
        resetUrl = new URL(configuredResetUrl);
    } else if (configuredClientUrl) {
        resetUrl = new URL("/reset-password", configuredClientUrl);
    } else {
        throw new Error(
            "PASSWORD_RESET_URL or CLIENT_URL must be configured"
        );
    }

    resetUrl.searchParams.set("token", token);
    return resetUrl.toString();
};

const clearPasswordResetToken = async (user) => {
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await userRepository.save(user);
};

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accountStatus: user.accountStatus || "active",
});

const ensureActiveAccount = (user) => {
    if (
        user.accountStatus &&
        user.accountStatus !== "active"
    ) {
        throw new ApiError(
            403,
            `This account is ${user.accountStatus}`
        );
    }
};

const issueSessionTokens = async (user) => {
    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    // Only a one-way hash is stored. A database leak must not expose a
    // usable refresh token.
    user.refreshTokenHash = hashToken(refreshToken);
    await userRepository.save(user);

    return { accessToken, refreshToken };
};

exports.register = async (payload) => {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existingUser = await userRepository.findByEmail(
        normalizedEmail
    );

    if (existingUser) {
        throw new ApiError(409, "Email already in use");
    }

    const user = await userRepository.createUser({
        name: payload.name,
        email: normalizedEmail,
        password: payload.password,
        phone: payload.phone,
        role: "user",
        accountStatus: "active",
    });

    return {
        message: "Registration successful",
        user: publicUser(user),
    };
};

exports.login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmailWithPassword(
        normalizedEmail
    );

    if (!user) {
        throw new ApiError(400, "Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatches) {
        throw new ApiError(400, "Invalid credentials");
    }

    ensureActiveAccount(user);

    const tokens = await issueSessionTokens(user);

    return {
        user: publicUser(user),
        ...tokens,
    };
};

exports.refreshToken = async ({ refreshToken }) => {
    if (!refreshToken) {
        throw new ApiError(401, "No refresh token provided");
    }

    let decoded;

    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new ApiError(
            401,
            "Invalid or expired refresh token"
        );
    }

    const user = await userRepository.findByIdWithRefreshToken(
        decoded.id
    );

    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    ensureActiveAccount(user);

    const presentedHash = hashToken(refreshToken);

    if (
        !user.refreshTokenHash ||
        user.refreshTokenHash !== presentedHash
    ) {
        // A valid but already-rotated token can indicate token replay.
        // Revoke the current session and require a fresh login.
        user.refreshTokenHash = null;
        await userRepository.save(user);

        throw new ApiError(
            401,
            "Refresh token has already been used or revoked"
        );
    }

    return issueSessionTokens(user);
};

exports.logout = async ({ refreshToken }) => {
    if (!refreshToken) {
        return;
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await userRepository.findByIdWithRefreshToken(
            decoded.id
        );

        if (
            user &&
            user.refreshTokenHash === hashToken(refreshToken)
        ) {
            user.refreshTokenHash = null;
            await userRepository.save(user);
        }
    } catch (error) {
        // Logout remains idempotent. Cookies are cleared even when the
        // presented refresh token is missing, expired, or malformed.
    }
};

exports.changePassword = async ({
    userId,
    currentPassword,
    newPassword,
}) => {
    const user = await userRepository.findByIdWithPassword(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    ensureActiveAccount(user);

    const passwordMatches = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!passwordMatches) {
        throw new ApiError(400, "Current password is incorrect");
    }

    const reusesCurrentPassword = await bcrypt.compare(
        newPassword,
        user.password
    );

    if (reusesCurrentPassword) {
        throw new ApiError(
            400,
            "New password must be different from the current password"
        );
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.refreshTokenHash = null;
    await userRepository.save(user);
};

exports.requestPasswordReset = async ({ email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    // Always return the same public response so this endpoint does not
    // reveal which email addresses are registered.
    if (
        !user ||
        (user.accountStatus &&
            user.accountStatus !== "active")
    ) {
        return null;
    }

    const { token, tokenHash } = createPasswordResetToken();

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(
        Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000
    );
    await userRepository.save(user);

    try {
        const resetUrl = buildPasswordResetUrl(token);
        const template = passwordResetTemplate({
            userName: user.name,
            resetUrl,
            expiresInMinutes: PASSWORD_RESET_MINUTES,
        });

        const delivery = await sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            idempotencyKey: [
                "password-reset",
                user._id,
                tokenHash.slice(0, 16),
            ].join(":"),
        });

        return {
            emailSent: true,
            deliveryId: delivery.id,
        };
    } catch (error) {
        try {
            await clearPasswordResetToken(user);
        } catch (cleanupError) {
            logger.error(
                `Failed to clear password reset token for user ${user._id}: ${cleanupError.message}`
            );
        }

        // The public endpoint must not reveal whether the email exists or
        // whether its delivery failed. Provider details stay in server logs.
        logger.error(
            `Password reset email was not delivered for user ${user._id}`
        );
        return null;
    }
};

exports.resetPassword = async ({ token, newPassword }) => {
    const user = await userRepository.findByPasswordResetToken(
        hashToken(token)
    );

    if (!user) {
        throw new ApiError(
            400,
            "Password reset token is invalid or expired"
        );
    }

    ensureActiveAccount(user);

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.refreshTokenHash = null;
    await userRepository.save(user);
};
