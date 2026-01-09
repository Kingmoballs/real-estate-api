require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const corsMiddleware = require("./middleware/corsMiddleware")
const helmet = require("helmet");
const sanitizeBody = require("./middleware/sanitizeHtmlMiddleware");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const httpLogger = require("./middleware/httpLogger");
const { apiLimiter, authLimiter } = require("./middleware/rateLimit");
const errorHandler = require("./middleware/errorMiddleware");

require("./cron/bookingStatusCron");



const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("./socket/socket"); 


//Route files
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

//Security Middleware
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

//Sanitation and cleaning
app.use(sanitizeBody)
app.use(hpp());

//Limit incoming body size
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//Cookie parser
app.use(cookieParser());

//CORS Middleware
app.use(corsMiddleware);

//HTTP request logger
app.use(httpLogger);

// Apply rate limit before routes
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);


//Root routes
app.get("/", (req, res) => {
    res.send("Real estate api is running...")
})

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

//Error handling middleware
app.use(errorHandler);

// SOCKET IO SETUP

// Create HTTP server
 const server = http.createServer(app);

 // Attach Socket.IO
const io = initSocket(server);

// Make io accessible everywhere (controllers, services)
app.set("io", io);


//Start Server
const PORT = process.env.PORT || 5000
mongoose.connect(process.env.MONGO_URI).then(() => {
    server.listen(PORT, () => {
        console.log(`Server + Socket.IO running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("MongoDB connection error: ", err.message)
});

