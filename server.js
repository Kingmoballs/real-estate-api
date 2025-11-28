const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config()

const app = express();

//Middleware
app.use(express.json())
app.use(cors());

const httpLogger = require("./middleware/httpLogger");
app.use(httpLogger);

const { apiLimiter, authLimiter } = require("./middleware/rateLimit");

// Apply rate limit before routes
app.use("/api", apiLimiter)
app.use("/api/auth", authLimiter)

//Root routes
app.get("/", (req, res) => {
    res.send("Real estate api is running...")
})

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const messageRoutes = require("./routes/messageRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");



//Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dashboard", dashboardRoutes);


const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

//Start Server
const PORT = process.env.PORT || 5000
mongoose.connect(process.env.MONGO_URI).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("MongoDB connection error: ", err.message)
});

