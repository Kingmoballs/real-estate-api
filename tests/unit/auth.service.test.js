jest.mock("bcryptjs", () => ({
    compare: jest.fn(),
}));

jest.mock("../../src/modules/user/user.repository", () => ({
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findByIdWithRefreshToken: jest.fn(),
    findByIdWithPassword: jest.fn(),
    findByPasswordResetToken: jest.fn(),
    createUser: jest.fn(),
    save: jest.fn(),
}));

jest.mock("@/shared/utils/authTokens", () => ({
    hashToken: jest.fn((token) => `hash:${token}`),
    createAccessToken: jest.fn(() => "new-access-token"),
    createRefreshToken: jest.fn(() => "new-refresh-token"),
    verifyRefreshToken: jest.fn(() => ({ id: "user-id" })),
    createPasswordResetToken: jest.fn(() => ({
        token: "reset-token",
        tokenHash: "reset-token-hash",
    })),
}));

jest.mock("@/shared/email/email.service", () => ({
    sendEmail: jest.fn(),
}));

jest.mock("@/shared/email/templates/passwordReset.template", () =>
    jest.fn(({ resetUrl }) => ({
        subject: "Reset your password",
        html: `<a href="${resetUrl}">Reset</a>`,
        text: `Reset: ${resetUrl}`,
    }))
);

jest.mock("@/shared/middleware/logger", () => ({
    error: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const userRepository = require(
    "../../src/modules/user/user.repository"
);
const { sendEmail } = require(
    "../../src/shared/email/email.service"
);
const passwordResetTemplate = require(
    "../../src/shared/email/templates/passwordReset.template"
);
const authService = require(
    "../../src/modules/auth/auth.service"
);

const createUser = (overrides = {}) => ({
    _id: "user-id",
    name: "Test User",
    email: "test@example.com",
    phone: "+2348000000000",
    role: "user",
    accountStatus: "active",
    password: "password-hash",
    refreshTokenHash: null,
    ...overrides,
});

describe("authentication service", () => {
    const originalClientUrl = process.env.CLIENT_URL;

    beforeAll(() => {
        process.env.CLIENT_URL = "http://localhost:5173";
    });

    afterAll(() => {
        if (originalClientUrl === undefined) {
            delete process.env.CLIENT_URL;
        } else {
            process.env.CLIENT_URL = originalClientUrl;
        }
    });

    beforeEach(() => {
        userRepository.save.mockImplementation(async (user) => user);
        bcrypt.compare.mockResolvedValue(true);
        sendEmail.mockResolvedValue({ id: "email-id" });
    });

    test("stores only a hash of the issued refresh token", async () => {
        const user = createUser();
        userRepository.findByEmailWithPassword.mockResolvedValue(user);

        const result = await authService.login({
            email: "TEST@example.com",
            password: "StrongPass!234",
        });

        expect(user.refreshTokenHash).toBe(
            "hash:new-refresh-token"
        );
        expect(user.refreshToken).toBeUndefined();
        expect(result.accessToken).toBe("new-access-token");
    });

    test("rotates a valid refresh token", async () => {
        const user = createUser({
            refreshTokenHash: "hash:presented-token",
        });
        userRepository.findByIdWithRefreshToken.mockResolvedValue(
            user
        );

        const result = await authService.refreshToken({
            refreshToken: "presented-token",
        });

        expect(result.refreshToken).toBe("new-refresh-token");
        expect(user.refreshTokenHash).toBe(
            "hash:new-refresh-token"
        );
    });

    test("revokes the session when a rotated token is replayed", async () => {
        const user = createUser({
            refreshTokenHash: "hash:current-token",
        });
        userRepository.findByIdWithRefreshToken.mockResolvedValue(
            user
        );

        await expect(
            authService.refreshToken({
                refreshToken: "old-token",
            })
        ).rejects.toMatchObject({ statusCode: 401 });

        expect(user.refreshTokenHash).toBeNull();
        expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    test("password reset revokes existing sessions", async () => {
        const user = createUser({
            refreshTokenHash: "hash:current-token",
        });
        userRepository.findByPasswordResetToken.mockResolvedValue(
            user
        );

        await authService.resetPassword({
            token: "reset-token",
            newPassword: "NewStrongPass!234",
        });

        expect(user.password).toBe("NewStrongPass!234");
        expect(user.refreshTokenHash).toBeNull();
        expect(user.passwordResetTokenHash).toBeNull();
    });

    test("emails a reset link without returning the raw token", async () => {
        const user = createUser();
        userRepository.findByEmail.mockResolvedValue(user);

        const result = await authService.requestPasswordReset({
            email: "TEST@example.com",
        });

        expect(user.passwordResetTokenHash).toBe(
            "reset-token-hash"
        );
        expect(user.passwordResetExpiresAt).toBeInstanceOf(Date);
        expect(passwordResetTemplate).toHaveBeenCalledWith(
            expect.objectContaining({
                userName: "Test User",
                resetUrl:
                    "http://localhost:5173/reset-password?token=reset-token",
                expiresInMinutes: 15,
            })
        );
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "test@example.com",
                idempotencyKey:
                    "password-reset:user-id:reset-token-hash",
            })
        );
        expect(result).toEqual({
            emailSent: true,
            deliveryId: "email-id",
        });
        expect(result.token).toBeUndefined();
    });

    test("does not send email for an unknown account", async () => {
        userRepository.findByEmail.mockResolvedValue(null);

        const result = await authService.requestPasswordReset({
            email: "unknown@example.com",
        });

        expect(result).toBeNull();
        expect(sendEmail).not.toHaveBeenCalled();
    });

    test("clears the reset token when email delivery fails", async () => {
        const user = createUser();
        userRepository.findByEmail.mockResolvedValue(user);
        sendEmail.mockRejectedValue(
            new Error("Provider unavailable")
        );

        const result = await authService.requestPasswordReset({
            email: user.email,
        });

        expect(result).toBeNull();
        expect(user.passwordResetTokenHash).toBeNull();
        expect(user.passwordResetExpiresAt).toBeNull();
        expect(userRepository.save).toHaveBeenCalledTimes(2);
    });
});
