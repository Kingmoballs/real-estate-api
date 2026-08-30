const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const User = require("@/modules/user/user.model");
const { onlineUsers } = require("@/shared/utils/onlineUsers");
const { isAllowedOrigin } = require("@/config/clientOrigins");

let io; 

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin(origin, callback) {
                if (isAllowedOrigin(origin)) {
                    return callback(null, true);
                }

                return callback(
                    new Error(
                        `Origin ${origin} is not allowed by CORS`
                    )
                );
            },
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            let token;

            if (socket.handshake.auth?.token) {
                token = socket.handshake.auth.token;
            }

            if (!token && socket.handshake.headers.cookie) {
                const cookies = cookie.parse(socket.handshake.headers.cookie);
                token = cookies.token;
            }

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                return next(new Error("User not found"));
            }

            if (
                user.accountStatus &&
                user.accountStatus !== "active"
            ) {
                return next(new Error("Account is not active"));
            }

            if (
                user.passwordChangedAt &&
                decoded.iat * 1000 <
                    user.passwordChangedAt.getTime()
            ) {
                return next(
                    new Error("Authentication token is no longer valid")
                );
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user._id.toString();

        onlineUsers.set(userId, socket.id);
        socket.join(userId);

        socket.broadcast.emit("user_online", { userId });

        socket.on("disconnect", async () => {
            onlineUsers.delete(userId);

            await User.findByIdAndUpdate(userId, {
                lastSeen: new Date()
            });

            socket.broadcast.emit("user_offline", {
                userId,
                lastSeen: new Date()
            });
        });
    });

    return io;
};

// EXPORT ACCESSOR
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

module.exports = {
    initSocket,
    getIO
};
