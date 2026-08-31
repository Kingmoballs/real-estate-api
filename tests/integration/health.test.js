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

    it("returns JSON for an unknown API route", async () => {
        const response = await request(app).get(
            "/api/not-a-real-route"
        );

        expect(response.statusCode).toBe(404);
        expect(response.headers["content-type"]).toMatch(
            /application\/json/
        );
        expect(response.body).toEqual({
            success: false,
            message: "Route not found",
        });
    });
});
