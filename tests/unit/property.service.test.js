jest.mock("../../src/modules/property/property.repository", () => ({
    findPaginated: jest.fn(),
}));

jest.mock("@/shared/utils/cloudinary", () => ({
    uploader: { destroy: jest.fn() },
}));

const propertyRepository = require(
    "../../src/modules/property/property.repository"
);
const propertyService = require(
    "../../src/modules/property/property.service"
);

describe("property public search service", () => {
    beforeEach(() => {
        propertyRepository.findPaginated.mockResolvedValue({
            properties: [],
            pagination: {},
        });
    });

    test("builds structured, amenity, size, and radius filters", async () => {
        await propertyService.getPublicProperties({
            city: "Lekki",
            state: "Lagos",
            amenities: ["parking", "security"],
            furnishingStatus: "furnished",
            sizeUnit: "sqm",
            minSize: 100,
            latitude: 6.4474,
            longitude: 3.4723,
            radiusKm: 10,
            page: 1,
            limit: 20,
        });

        expect(
            propertyRepository.findPaginated
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                filters: expect.objectContaining({
                    listingStatus: "published",
                    amenities: {
                        $all: ["parking", "security"],
                    },
                    furnishingStatus: "furnished",
                    "size.unit": "sqm",
                    "size.value": { $gte: 100 },
                    geoLocation: {
                        $geoWithin: {
                            $centerSphere: [
                                [3.4723, 6.4474],
                                10 / 6378.1,
                            ],
                        },
                    },
                }),
            })
        );
    });
});
