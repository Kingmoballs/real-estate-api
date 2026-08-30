const cors = require("cors");
const { isAllowedOrigin } = require("@/config/clientOrigins");
const ApiError = require("@/shared/utils/ApiError");

const corsMiddleware = cors({
    origin(origin, callback) {
        // Allow Postman, mobile apps and server-to-server requests
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        return callback(
            new ApiError(
                403,
                `Origin ${origin} is not allowed by CORS`
            )
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
        "X-Requested-With",
        "X-CSRF-Token"
    ],

    optionsSuccessStatus: 204
});

module.exports = corsMiddleware;
