require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");

require("module-alias/register");
const app = require("@/app");
const { initSocket } = require("@/socket/socket"); 

// Prevent cron job during test
if (process.env.NODE_ENV !== "test") {
    require("@/cron/bookingStatusCron");
}

const PORT = process.env.PORT || 5000

// Create HTTP server
 const server = http.createServer(app);

// Attach Socket.IO ONLY outside tests
let io;
if (process.env.NODE_ENV !== "test") {
  io = initSocket(server);
  app.set("io", io);
}



// Connect DB and Start Server

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server + Socket.IO running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("MongoDB connection error: ", err.message)
});

