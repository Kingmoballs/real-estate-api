const Redis = require("ioredis");

let redis;

if (process.env.NODE_ENV === "test") {
    // Mock redis for tests
    redis = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        expire: jest.fn(),
        quit: jest.fn(),
        on: jest.fn(),
    };
} else {
    redis = new Redis(process.env.REDIS_PUBLIC_URL);

    redis.on("error", (err) => {
        console.error("Redis error", err);
    });
}

module.exports = redis;