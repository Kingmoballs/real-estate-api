const ApiError = require("@/shared/utils/ApiError");
const logger = require("@/shared/middleware/logger");
const {
    getEmailClient,
    getEmailDefaults,
} = require("@/config/email");

const normalizeRecipients = (to) => {
    const recipients = Array.isArray(to) ? to : [to];
    const normalized = recipients
        .filter((recipient) => typeof recipient === "string")
        .map((recipient) => recipient.trim())
        .filter(Boolean);

    if (!normalized.length) {
        throw new ApiError(500, "Email recipient is required");
    }

    return Array.isArray(to) ? normalized : normalized[0];
};

const logDeliveryFailure = (error) => {
    const name = error?.name || "EmailProviderError";
    const message = error?.message || "Unknown email provider error";

    logger.error(`Email delivery failed [${name}]: ${message}`);
};

exports.sendEmail = async ({
    to,
    subject,
    html,
    text,
    idempotencyKey,
}) => {
    if (typeof subject !== "string" || !subject.trim()) {
        throw new ApiError(500, "Email subject is required");
    }

    if (!html && !text) {
        throw new ApiError(500, "Email content is required");
    }

    let client;
    let defaults;

    try {
        client = getEmailClient();
        defaults = getEmailDefaults();
    } catch (error) {
        logDeliveryFailure(error);
        throw new ApiError(
            503,
            "Email service is temporarily unavailable"
        );
    }

    const payload = {
        from: defaults.from,
        to: normalizeRecipients(to),
        subject: subject.trim(),
        html,
        text,
    };

    if (defaults.replyTo) {
        payload.replyTo = defaults.replyTo;
    }

    const requestOptions = idempotencyKey
        ? { idempotencyKey }
        : undefined;

    try {
        const { data, error } = await client.emails.send(
            payload,
            requestOptions
        );

        if (error) {
            logDeliveryFailure(error);
            throw new ApiError(502, "Email delivery failed");
        }

        if (!data?.id) {
            const missingIdError = new Error(
                "Email provider returned no delivery ID"
            );
            logDeliveryFailure(missingIdError);
            throw new ApiError(502, "Email delivery failed");
        }

        return { id: data.id };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        logDeliveryFailure(error);
        throw new ApiError(502, "Email delivery failed");
    }
};
