const developmentOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
];

const getAllowedOrigins = () => {
    const configuredOrigins = (
        process.env.CLIENT_URL || ""
    )
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return new Set([
        ...configuredOrigins,
        ...(process.env.NODE_ENV !== "production"
            ? developmentOrigins
            : []),
    ]);
};

const isAllowedOrigin = (origin) => {
    // Requests without Origin include Postman, native apps, and
    // server-to-server traffic.
    return !origin || getAllowedOrigins().has(origin);
};

module.exports = {
    getAllowedOrigins,
    isAllowedOrigin,
};
