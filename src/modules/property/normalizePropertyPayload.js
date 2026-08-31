const normalizeAmenities = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return [];
    }

    if (trimmed.startsWith("[")) {
        try {
            const parsed = JSON.parse(trimmed);

            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (error) {
            // Let Joi return the final validation error below.
        }
    }

    return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

module.exports = (req, res, next) => {
    if (req.body?.amenities !== undefined) {
        req.body.amenities = normalizeAmenities(
            req.body.amenities
        );
    }

    next();
};
