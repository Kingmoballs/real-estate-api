const normalizePropertyPayload = require(
    "../../src/modules/property/normalizePropertyPayload"
);

describe("property multipart normalization", () => {
    const run = (amenities) => {
        const req = { body: { amenities } };
        const next = jest.fn();

        normalizePropertyPayload(req, {}, next);

        expect(next).toHaveBeenCalledTimes(1);
        return req.body.amenities;
    };

    test("accepts comma-separated amenities from Postman", () => {
        expect(run("parking, security, internet")).toEqual([
            "parking",
            "security",
            "internet",
        ]);
    });

    test("accepts a JSON array from multipart form data", () => {
        expect(run('["parking","security"]')).toEqual([
            "parking",
            "security",
        ]);
    });
});
