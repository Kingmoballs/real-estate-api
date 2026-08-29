const sanitizeHtml = require("sanitize-html");

const sanitizeValue = (value) => {
    if (typeof value === "string") {
        return sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {}
        });
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (value && typeof value === "object") {
        for (const key of Object.keys(value)) {
            if (
                key === "__proto__" ||
                key === "constructor" ||
                key === "prototype"
            ) {
                delete value[key];
                continue;
            }

            value[key] = sanitizeValue(value[key]);
        }
    }

    return value;
};

const sanitizeBody = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }

    next();
};

module.exports = sanitizeBody;