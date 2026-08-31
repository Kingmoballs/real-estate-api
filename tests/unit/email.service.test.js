jest.mock("../../src/config/email", () => ({
    getEmailClient: jest.fn(),
    getEmailDefaults: jest.fn(),
}));

jest.mock("../../src/shared/middleware/logger", () => ({
    error: jest.fn(),
}));

const emailConfig = require("../../src/config/email");
const logger = require("../../src/shared/middleware/logger");
const { sendEmail } = require(
    "../../src/shared/email/email.service"
);

describe("email service", () => {
    const send = jest.fn();

    beforeEach(() => {
        emailConfig.getEmailClient.mockReturnValue({
            emails: { send },
        });
        emailConfig.getEmailDefaults.mockReturnValue({
            from: "Real Estate Platform <onboarding@resend.dev>",
            replyTo: "owner@example.com",
        });
    });

    test("sends email with configured defaults and idempotency", async () => {
        send.mockResolvedValue({
            data: { id: "email-id" },
            error: null,
        });

        const result = await sendEmail({
            to: "customer@example.com",
            subject: "Reset password",
            html: "<p>Reset</p>",
            text: "Reset",
            idempotencyKey: "password-reset:user-id:token-id",
        });

        expect(send).toHaveBeenCalledWith(
            expect.objectContaining({
                from: "Real Estate Platform <onboarding@resend.dev>",
                to: "customer@example.com",
                replyTo: "owner@example.com",
                subject: "Reset password",
            }),
            {
                idempotencyKey: "password-reset:user-id:token-id",
            }
        );
        expect(result).toEqual({ id: "email-id" });
    });

    test("converts provider failures into a safe API error", async () => {
        send.mockResolvedValue({
            data: null,
            error: {
                name: "validation_error",
                message: "Recipient is not allowed",
            },
        });

        await expect(
            sendEmail({
                to: "customer@example.com",
                subject: "Reset password",
                text: "Reset",
            })
        ).rejects.toMatchObject({
            statusCode: 502,
            message: "Email delivery failed",
        });

        expect(logger.error).toHaveBeenCalled();
    });

    test("reports missing email configuration as unavailable", async () => {
        emailConfig.getEmailClient.mockImplementation(() => {
            throw new Error("Email service is not configured");
        });

        await expect(
            sendEmail({
                to: "customer@example.com",
                subject: "Reset password",
                text: "Reset",
            })
        ).rejects.toMatchObject({ statusCode: 503 });
    });
});
