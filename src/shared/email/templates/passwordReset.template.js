const escapeHtml = (value) =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

module.exports = ({
    userName,
    resetUrl,
    expiresInMinutes,
}) => {
    if (!resetUrl) {
        throw new Error("Password reset URL is required");
    }

    const safeName = escapeHtml(userName?.trim() || "there");
    const safeResetUrl = escapeHtml(resetUrl);
    const expiry = Number.isFinite(expiresInMinutes)
        ? expiresInMinutes
        : 15;

    const subject = "Reset your Real Estate Platform password";

    const html = `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
</head>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 4px 18px rgba(15,23,42,0.08);">
            <h1 style="margin:0 0 20px;font-size:24px;color:#111827;">Reset your password</h1>
            <p style="line-height:1.6;">Hello ${safeName},</p>
            <p style="line-height:1.6;">We received a request to reset your Real Estate Platform password.</p>
            <div style="margin:28px 0;text-align:center;">
                <a href="${safeResetUrl}" style="display:inline-block;background:#166534;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:700;">Reset password</a>
            </div>
            <p style="line-height:1.6;">This link expires in ${expiry} minutes and can only be used once.</p>
            <p style="line-height:1.6;">If the button does not work, copy and paste this URL into your browser:</p>
            <p style="line-height:1.6;word-break:break-all;color:#166534;">${safeResetUrl}</p>
            <p style="line-height:1.6;">If you did not request this reset, you can safely ignore this email. Never share this link or your password with anyone.</p>
        </div>
        <p style="text-align:center;color:#6b7280;font-size:12px;margin-top:20px;">Real Estate Platform security notification</p>
    </div>
</body>
</html>`.trim();

    const text = [
        `Hello ${userName?.trim() || "there"},`,
        "",
        "We received a request to reset your Real Estate Platform password.",
        "",
        `Reset your password: ${resetUrl}`,
        "",
        `This link expires in ${expiry} minutes and can only be used once.`,
        "",
        "If you did not request this reset, ignore this email. Never share this link or your password with anyone.",
    ].join("\n");

    return { subject, html, text };
};

module.exports.escapeHtml = escapeHtml;
