const {
    authorizeRoles,
} = require("../../src/shared/middleware/authMiddleware");

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
});

describe("authorizeRoles middleware", () => {
    test("returns 401 when no authenticated user exists", () => {
        const req = {};
        const res = createResponse();
        const next = jest.fn();

        authorizeRoles("admin")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 when the user's role is not allowed", () => {
        const req = {
            user: {
                role: "user",
            },
        };

        const res = createResponse();
        const next = jest.fn();

        authorizeRoles("admin")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("allows an authorized role", () => {
        const req = {
            user: {
                role: "admin",
            },
        };

        const res = createResponse();
        const next = jest.fn();

        authorizeRoles("admin")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test("supports multiple allowed roles", () => {
        const req = {
            user: {
                role: "agent",
            },
        };

        const res = createResponse();
        const next = jest.fn();

        authorizeRoles("admin", "agent")(
            req,
            res,
            next
        );

        expect(next).toHaveBeenCalledTimes(1);
    });
});