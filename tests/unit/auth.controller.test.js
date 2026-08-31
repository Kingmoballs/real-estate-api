jest.mock("../../src/modules/auth/auth.service", () => ({
    requestPasswordReset: jest.fn(),
}));

const authService = require(
    "../../src/modules/auth/auth.service"
);
const { forgotPassword } = require(
    "../../src/modules/auth/auth.controller"
);

describe("authentication controller", () => {
    test("forgot-password response never exposes a reset token", async () => {
        authService.requestPasswordReset.mockResolvedValue({
            emailSent: true,
            deliveryId: "email-id",
            token: "must-not-be-returned",
        });

        const req = {
            body: { email: "test@example.com" },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const next = jest.fn();

        await forgotPassword(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message:
                "If an active account exists for that email, password reset instructions have been sent.",
        });
        expect(
            JSON.stringify(res.json.mock.calls[0][0])
        ).not.toContain("must-not-be-returned");
        expect(next).not.toHaveBeenCalled();
    });
});
