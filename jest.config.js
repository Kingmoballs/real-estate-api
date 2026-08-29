module.exports = {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.js"],

    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    },

    testTimeout: 15000,
    clearMocks: true
};