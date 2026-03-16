module.exports = {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.js"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    globalTeardown: "<rootDir>/tests/teardown.js",
    testTimeout: 15000,
    clearMocks: true,
};
