const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("../models/user");

const { onlineUsers } = require("../utils/onlineUsers");

const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            let token;

            // Try cookie (web apps)
            if (socket.handshake.headers.cookie) {
                const cookies = cookie.parse(socket.handshake.headers.cookie);
                token = cookies.token;
            }

            // Fallback to bearer token (mobile/Postman)
            if (!token && socket.handshake.auth?.token) {
                token = socket.handshake.auth.token;
            }

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user; // attach user
            next();
        } catch (err) {
            console.log("Socket log error", err.message)
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.user._id}`);

        const userId = socket.user._id.toString();
        // Add to online users
        onlineUsers.set(userId, socket.id);
        // Join user-specific room
        socket.join(userId.toString());

        // Broadcast online status
        socket.broadcast.emit("user_online", {
            userId
        });

        console.log(`User online: ${userId}`);

        socket.on("disconnect", async () => {
            onlineUsers.delete(userId);

            await User.findByIdAndUpdate(userId, {
                lastSeen: new Date()
            });

            socket.broadcast.emit("user_offline", {
                userId,
                lastSeen: new Date()
            });

            console.log(`Socket disconnected: ${userId}`);
        });
    });

    return io;
};

module.exports = initSocket;