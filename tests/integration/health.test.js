const request = require("supertest");
const app = require("../../src/app");

describe("API health check", () => {
    it("responds on the root route", async () => {
        const response = await request(app).get("/");

        expect(response.statusCode).toBe(200);
        expect(response.text).toContain(
            "Real estate api is running"
        );
    });
});