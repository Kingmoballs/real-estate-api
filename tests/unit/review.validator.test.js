const {
    createReviewSchema,
    updateReviewSchema,
    moderationSchema,
} = require("../../src/modules/review/review.validator");

describe("review validators", () => {
    const propertyId = "64b7f2c1e4b0a123456789ab";

    test("accepts a valid verified-review payload", () => {
        const { error, value } = createReviewSchema.validate({
            property: propertyId,
            rating: 5,
            title: "Excellent experience",
            comment: "The property was exactly as described.",
        });

        expect(error).toBeUndefined();
        expect(value.rating).toBe(5);
    });

    test("rejects ratings outside the one-to-five range", () => {
        const { error } = createReviewSchema.validate({
            property: propertyId,
            rating: 6,
            comment: "The property was exactly as described.",
        });

        expect(error).toBeDefined();
    });

    test("requires at least one field when updating", () => {
        const { error } = updateReviewSchema.validate({});
        expect(error).toBeDefined();
    });

    test("requires a reason when an admin hides a review", () => {
        const { error } = moderationSchema.validate({
            status: "hidden",
        });

        expect(error).toBeDefined();
    });
});
