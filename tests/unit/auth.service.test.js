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

const bcrypt = require("bcryptjs");
const userRepository = require(
    "../../src/modules/user/user.repository"
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
    beforeEach(() => {
        userRepository.save.mockImplementation(async (user) => user);
        bcrypt.compare.mockResolvedValue(true);
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
});
