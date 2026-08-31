jest.mock("../../src/modules/property/property.repository", () => ({
    create: jest.fn(),
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

describe("structured property creation", () => {
    test("maps flat multipart fields to address, GeoJSON, and size", async () => {
        propertyRepository.create.mockImplementation(
            async (data) => data
        );

        await propertyService.createProperty({
            user: {
                _id: "507f1f77bcf86cd799439011",
                name: "Test Agent",
                email: "agent@example.com",
                phone: "+2348000000000",
            },
            body: {
                title: "Modern Lekki Apartment",
                description: "A comfortable property in Lagos.",
                listingType: "rent",
                propertyType: "apartment",
                price: 5000000,
                currency: "NGN",
                pricePeriod: "year",
                streetAddress: "10 Admiralty Way",
                city: "Lekki",
                state: "Lagos",
                country: "Nigeria",
                latitude: 6.4474,
                longitude: 3.4723,
                sizeValue: 120,
                sizeUnit: "sqm",
                amenities: ["parking", "security"],
            },
            files: [
                {
                    path: "https://example.com/property.jpg",
                    filename: "property-image",
                },
            ],
        });

        expect(propertyRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                location:
                    "10 Admiralty Way, Lekki, Lagos, Nigeria",
                address: {
                    streetAddress: "10 Admiralty Way",
                    city: "Lekki",
                    state: "Lagos",
                    lga: "",
                    country: "Nigeria",
                    postalCode: "",
                },
                geoLocation: {
                    type: "Point",
                    coordinates: [3.4723, 6.4474],
                },
                size: { value: 120, unit: "sqm" },
            })
        );
    });
});
