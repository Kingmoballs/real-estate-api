const request = require("supertest");
const app = require("../../app");

describe("API health check", () => {
    it("should respond on root route", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Real estate api");
    });
});
