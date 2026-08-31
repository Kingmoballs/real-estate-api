jest.mock("../../src/modules/property/property.repository", () => ({
    findById: jest.fn(),
    findPublicById: jest.fn(),
    updateRatingSummary: jest.fn(),
}));

jest.mock("../../src/modules/booking/booking.repository", () => ({
    findCompletedByGuestAndProperty: jest.fn(),
}));

jest.mock("../../src/modules/inspection/inspection.repository", () => ({
    findCompletedByCustomerAndProperty: jest.fn(),
}));

jest.mock("../../src/modules/review/review.repository", () => ({
    create: jest.fn(),
    save: jest.fn(),
    deleteById: jest.fn(),
    findById: jest.fn(),
    findByIdWithDetails: jest.fn(),
    findByCustomerAndProperty: jest.fn(),
    findPaginated: jest.fn(),
    findPublicPaginated: jest.fn(),
    getPublishedRatingSummary: jest.fn(),
}));

jest.mock("../../src/shared/events/eventBus", () => ({
    emit: jest.fn(),
}));

const propertyRepository = require(
    "../../src/modules/property/property.repository"
);
const bookingRepository = require(
    "../../src/modules/booking/booking.repository"
);
const inspectionRepository = require(
    "../../src/modules/inspection/inspection.repository"
);
const reviewRepository = require(
    "../../src/modules/review/review.repository"
);
const eventBus = require("../../src/shared/events/eventBus");
const reviewService = require(
    "../../src/modules/review/review.service"
);

describe("review service", () => {
    const propertyId = "64b7f2c1e4b0a123456789ab";
    const customerId = "64b7f2c1e4b0a123456789ac";
    const agentId = "64b7f2c1e4b0a123456789ad";
    const sourceId = "64b7f2c1e4b0a123456789ae";
    const reviewId = "64b7f2c1e4b0a123456789af";

    const user = {
        _id: customerId,
        name: "Customer One",
        role: "user",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        reviewRepository.findByCustomerAndProperty.mockResolvedValue(null);
    });

    test("uses a completed booking for shortlet eligibility", async () => {
        propertyRepository.findById.mockResolvedValue({
            _id: propertyId,
            listingType: "shortlet",
        });
        bookingRepository.findCompletedByGuestAndProperty.mockResolvedValue({
            _id: sourceId,
        });

        const result = await reviewService.checkEligibility({
            user,
            propertyId,
        });

        expect(result).toEqual(
            expect.objectContaining({
                eligible: true,
                verificationSource: "booking",
                booking: sourceId,
            })
        );
    });

    test("uses a completed inspection for rent eligibility", async () => {
        propertyRepository.findById.mockResolvedValue({
            _id: propertyId,
            listingType: "rent",
        });
        inspectionRepository.findCompletedByCustomerAndProperty.mockResolvedValue(
            { _id: sourceId }
        );

        const result = await reviewService.checkEligibility({
            user,
            propertyId,
        });

        expect(result).toEqual(
            expect.objectContaining({
                eligible: true,
                verificationSource: "inspection",
                inspection: sourceId,
            })
        );
    });

    test("rejects review creation without a completed interaction", async () => {
        propertyRepository.findById.mockResolvedValue({
            _id: propertyId,
            postedBy: agentId,
            listingType: "sale",
        });
        inspectionRepository.findCompletedByCustomerAndProperty.mockResolvedValue(
            null
        );

        await expect(
            reviewService.createReview({
                user,
                payload: {
                    property: propertyId,
                    rating: 4,
                    title: "Good property",
                    comment: "The property matched most of the listing details.",
                },
            })
        ).rejects.toMatchObject({ statusCode: 403 });
    });

    test("creates a verified review and refreshes the rating summary", async () => {
        propertyRepository.findById.mockResolvedValue({
            _id: propertyId,
            postedBy: agentId,
            listingType: "rent",
            title: "Lekki Apartment",
        });
        inspectionRepository.findCompletedByCustomerAndProperty.mockResolvedValue(
            { _id: sourceId }
        );
        reviewRepository.create.mockResolvedValue({
            _id: reviewId,
            property: propertyId,
            rating: 5,
        });
        reviewRepository.getPublishedRatingSummary.mockResolvedValue({
            ratingAverage: 4.75,
            reviewCount: 4,
        });
        reviewRepository.findByIdWithDetails.mockResolvedValue({
            _id: reviewId,
        });

        const result = await reviewService.createReview({
            user,
            payload: {
                property: propertyId,
                rating: 5,
                title: "Great viewing",
                comment: "The property was exactly as described in the listing.",
            },
        });

        expect(propertyRepository.updateRatingSummary).toHaveBeenCalledWith(
            propertyId,
            { ratingAverage: 4.75, reviewCount: 4 }
        );
        expect(eventBus.emit).toHaveBeenCalled();
        expect(result.ratingSummary.reviewCount).toBe(4);
    });
});
