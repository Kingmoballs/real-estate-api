const onlineUsers = new Map();

module.exports = {
    onlineUsers,
    isUserOnline: (userId) => onlineUsers.has(userId),
}