const cors = require("cors");

const developmentOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173"
];

const configuredOrigins = (
    process.env.CLIENT_URL || ""
)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

const allowedOrigins = new Set([
    ...configuredOrigins,
    ...(process.env.NODE_ENV !== "production"
        ? developmentOrigins
        : [])
]);

const corsMiddleware = cors({
    origin(origin, callback) {
        // Allow Postman, mobile apps and server-to-server requests
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(
            new Error(`Origin ${origin} is not allowed by CORS`)
        );
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],

    optionsSuccessStatus: 204
});

module.exports = corsMiddleware;