const express = require("express");
const Joi = require("joi");
const request = require("supertest");

const validateQuery = require(
    "../../src/shared/middleware/validateQueryMiddleware"
);

describe("query validation middleware", () => {
    test("preserves Joi conversions and removes unknown keys in Express 5", async () => {
        const app = express();
        const schema = Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
        });

        app.get(
            "/search",
            validateQuery(schema),
            (req, res) => {
                res.json({
                    query: req.query,
                    pageType: typeof req.query.page,
                    limitType: typeof req.query.limit,
                });
            }
        );

        const response = await request(app)
            .get("/search")
            .query({ page: "2", limit: "10", ignored: "value" });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            query: { page: 2, limit: 10 },
            pageType: "number",
            limitType: "number",
        });
    });
});
