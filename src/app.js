const express = require("express");
const helmet = require("helmet");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const corsMiddleware = require("@/shared/middleware/corsMiddleware");
const sanitizeBody = require("@/shared/middleware/sanitizeHtmlMiddleware");
const httpLogger = require("@/shared/middleware/httpLogger");
const { apiLimiter, authLimiter } = require("./shared/middleware/rateLimit");
const errorHandler = require("@/shared/middleware/errorMiddleware");


//Event listeners
require("@/modules/notification/notification.listener");


//////////////
//Route files
//////////////
const authRoutes = require("@/modules/auth/auth.route");
const propertyRoutes = require("@/modules/property/property.route");
const bookingRoutes = require("@/modules/booking/booking.route");
const chatRoutes = require("@/modules/chat/chat.route");
const dashboardRoutes = require("@/modules/dashboard/dashboard.route");
const notificationRoutes = require("@/modules/notification/notification.route");
const userRoutes = require("@/modules/user/user.route");

const app = express();

///////////
//Security
///////////
app.use(helmet()); //set security headers
app.disable("x-powered-by"); //hide express header

if (process.env.NODE_ENV === "production") {
    app.use(
        helmet.hsts({
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        })
    );
}

///////////////
// Middlewares
///////////////
app.use(sanitizeBody)
app.use(hpp());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(corsMiddleware);
app.use(httpLogger);

/////////////////
// Rate Limiting
/////////////////
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

/////////
//Routes
/////////
app.get("/", (req, res) => {
    res.send("Real estate api is running...")
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

////////////////
//Error handler
////////////////
app.use(errorHandler);

module.exports = app