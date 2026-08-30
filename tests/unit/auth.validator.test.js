const {
    registerSchema,
    changePasswordSchema,
    resetPasswordSchema,
} = require("../../src/modules/auth/auth.validator");

describe("authentication validation", () => {
    const strongPassword = "StrongPass!234";

    test("normalizes registration email and accepts a strong password", () => {
        const { error, value } = registerSchema.validate({
            name: "Test User",
            email: "  TEST@Example.COM ",
            password: strongPassword,
            phone: "+2348000000000",
        });

        expect(error).toBeUndefined();
        expect(value.email).toBe("test@example.com");
    });

    test("rejects passwords missing required character groups", () => {
        const { error } = registerSchema.validate({
            name: "Test User",
            email: "test@example.com",
            password: "alllowercase123",
            phone: "+2348000000000",
        });

        expect(error).toBeDefined();
    });

    test("validates change and reset password payloads", () => {
        expect(
            changePasswordSchema.validate({
                currentPassword: "OldPassword!123",
                newPassword: strongPassword,
            }).error
        ).toBeUndefined();

        expect(
            resetPasswordSchema.validate({
                token: "a".repeat(64),
                newPassword: strongPassword,
            }).error
        ).toBeUndefined();
    });
});
