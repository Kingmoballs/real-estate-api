const Redis = require("ioredis");

let redis;

if (process.env.NODE_ENV === "test") {
    redis = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue("OK"),
        del: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        eval: jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue("OK"),
        disconnect: jest.fn(),
        on: jest.fn()
    };
} else {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        throw new Error("REDIS_URL is not defined");
    }

    redis = new Redis(redisUrl, {
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,

        retryStrategy(attempt) {
            return Math.min(attempt * 200, 2000);
        }
    });

    redis.on("connect", () => {
        console.log("Redis connection established");
    });

    redis.on("ready", () => {
        console.log("Redis is ready");
    });

    redis.on("error", (err) => {
        console.error("Redis error:", err.message);
    });
}

module.exports = redis;