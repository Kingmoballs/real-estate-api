const redis = require("../config/redis");
const ApiError = require("./ApiError");
const crypto = require("crypto");

const LOCK_TTL = 30; // seconds

exports.acquireLock = async (key) => {
    const token = crypto.randomUUID();

    const acquired = await redis.set(
        key,
        token,
        "NX",
        "EX",
        LOCK_TTL
    );

    if (!acquired) {
        throw new ApiError(
            409,
            "This apartment is currently being booked. Please try again."
        );
    }

    return token;
};

exports.releaseLock = async (key, token) => {
    const luaScript = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        else
            return 0
        end
    `;

    await redis.eval(luaScript, 1, key, token);
};
