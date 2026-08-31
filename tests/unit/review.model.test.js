const mongoose = require("mongoose");
const Review = require("../../src/modules/review/review.model");

describe("review model", () => {
    const property = new mongoose.Types.ObjectId();
    const customer = new mongoose.Types.ObjectId();
    const propertyAgent = new mongoose.Types.ObjectId();

    test("accepts a booking-verified review", async () => {
        const review = new Review({
            property,
            customer,
            propertyAgent,
            rating: 5,
            comment: "A genuinely excellent shortlet experience.",
            verificationSource: "booking",
            booking: new mongoose.Types.ObjectId(),
        });

        await expect(review.validate()).resolves.toBeUndefined();
        expect(review.inspection).toBeNull();
    });

    test("requires the matching verification record", async () => {
        const review = new Review({
            property,
            customer,
            propertyAgent,
            rating: 4,
            comment: "The inspection experience was very helpful.",
            verificationSource: "inspection",
        });

        await expect(review.validate()).rejects.toThrow(
            "An inspection is required"
        );
    });

    test("defines one review per customer and property", () => {
        const indexes = Review.schema.indexes();
        const uniqueIndex = indexes.find(
            ([fields, options]) =>
                fields.property === 1 &&
                fields.customer === 1 &&
                options.unique === true
        );

        expect(uniqueIndex).toBeDefined();
    });
});
