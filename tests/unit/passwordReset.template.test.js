const passwordResetTemplate = require(
    "../../src/shared/email/templates/passwordReset.template"
);

describe("password reset email template", () => {
    test("returns HTML and plain-text versions", () => {
        const result = passwordResetTemplate({
            userName: "Test User",
            resetUrl:
                "http://localhost:5173/reset-password?token=abc123",
            expiresInMinutes: 15,
        });

        expect(result.subject).toContain("Reset");
        expect(result.html).toContain("Reset password");
        expect(result.html).toContain("abc123");
        expect(result.text).toContain("abc123");
        expect(result.text).toContain("15 minutes");
    });

    test("escapes dynamic HTML values", () => {
        const result = passwordResetTemplate({
            userName: '<script>alert("x")</script>',
            resetUrl:
                "https://example.com/reset?token=a&source=email",
            expiresInMinutes: 10,
        });

        expect(result.html).not.toContain("<script>");
        expect(result.html).toContain("&lt;script&gt;");
        expect(result.html).toContain("a&amp;source=email");
        expect(result.text).toContain("a&source=email");
    });

    test("requires a reset URL", () => {
        expect(() =>
            passwordResetTemplate({
                userName: "Test User",
                expiresInMinutes: 15,
            })
        ).toThrow("Password reset URL is required");
    });
});
