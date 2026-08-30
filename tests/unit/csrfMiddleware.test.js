const csrfProtection = require(
    "../../src/shared/middleware/csrfMiddleware"
);

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
});

const createRequest = (overrides = {}) => ({
    method: "POST",
    path: "/api/bookings",
    headers: {},
    cookies: {},
    get(name) {
        return this.headers[name.toLowerCase()];
    },
    ...overrides,
});

describe("CSRF protection", () => {
    test("allows safe methods", () => {
        const req = createRequest({ method: "GET" });
        const res = createResponse();
        const next = jest.fn();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    test("allows explicitly supplied Bearer authentication", () => {
        const req = createRequest({
            headers: { authorization: "Bearer access-token" },
            cookies: { token: "cookie-token" },
        });
        const res = createResponse();
        const next = jest.fn();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    test("requires matching tokens for cookie-authenticated writes", () => {
        const req = createRequest({
            headers: { "x-csrf-token": "csrf-value" },
            cookies: {
                token: "access-token",
                csrfToken: "csrf-value",
            },
        });
        const res = createResponse();
        const next = jest.fn();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    test("rejects a missing CSRF header", () => {
        const req = createRequest({
            cookies: {
                token: "access-token",
                csrfToken: "csrf-value",
            },
        });
        const res = createResponse();
        const next = jest.fn();

        csrfProtection(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("does not block public login because of stale cookies", () => {
        const req = createRequest({
            path: "/api/auth/login",
            cookies: { token: "stale-token" },
        });
        const res = createResponse();
        const next = jest.fn();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });
});
