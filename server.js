const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")

const app = express()

//Middleware
app.use(express.json())
app.use(cors())

//Root routes
app.get("/", (req, res) => {
    res.send("Real estate api is running...")
})

//Routes
app.use("/api/auth", authRoutes)

//Start Server
const PORT = process.env.PORT || 5000
mongoose.connect(process.env.MONGO_URI).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("MongoDB connection error: ", err.message)
})