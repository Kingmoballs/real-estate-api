const { Resend } = require("resend");

const getTrimmedEnv = (name) => process.env[name]?.trim() || "";

const apiKey = getTrimmedEnv("RESEND_API_KEY");
const from = getTrimmedEnv("EMAIL_FROM");
const replyTo = getTrimmedEnv("EMAIL_REPLY_TO");
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
    const missing = [];

    if (!apiKey) missing.push("RESEND_API_KEY");
    if (!from) missing.push("EMAIL_FROM");

    if (missing.length) {
        throw new Error(
            `Missing required email configuration: ${missing.join(", ")}`
        );
    }
}

const client = !isTest && apiKey ? new Resend(apiKey) : null;

const getEmailClient = () => {
    if (!client) {
        throw new Error("Email service is not configured");
    }

    return client;
};

const getEmailDefaults = () => {
    if (!from) {
        throw new Error("EMAIL_FROM is not configured");
    }

    return {
        from,
        replyTo: replyTo || undefined,
    };
};

module.exports = {
    getEmailClient,
    getEmailDefaults,
    isEmailConfigured: Boolean(apiKey && from),
};
