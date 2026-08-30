const request = require("supertest");
const app = require("../../src/app");

describe("API CSRF boundary", () => {
    test("rejects cookie-authenticated writes without a CSRF header", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .set("Cookie", [
                "token=automatic-browser-cookie",
                "csrfToken=expected-token",
            ])
            .send({});

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe(
            "Invalid or missing CSRF token"
        );
    });

    test("allows public login validation even when stale cookies exist", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .set("Cookie", ["token=stale-cookie"])
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe("Validation error");
    });

    test("Bearer requests bypass CSRF and continue to authentication", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", "Bearer invalid-token")
            .set("Cookie", ["token=stale-cookie"])
            .send({});

        expect(response.statusCode).toBe(401);
    });
});

describe("API CORS boundary", () => {
    test("returns 403 for an unapproved browser origin", async () => {
        const response = await request(app)
            .get("/")
            .set("Origin", "https://unapproved.example");

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toContain(
            "is not allowed by CORS"
        );
    });

    test("allows a configured development origin", async () => {
        const response = await request(app)
            .get("/")
            .set("Origin", "http://localhost:5173");

        expect(response.statusCode).toBe(200);
        expect(response.headers["access-control-allow-origin"]).toBe(
            "http://localhost:5173"
        );
    });
});
