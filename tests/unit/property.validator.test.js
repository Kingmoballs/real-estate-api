const {
    createPropertySchema,
    updatePropertySchema,
    publicPropertyQuerySchema,
} = require("../../src/modules/property/property.validator");

const baseProperty = {
    title: "Modern Lekki Apartment",
    description: "A comfortable apartment in a secure estate.",
    listingType: "rent",
    propertyType: "apartment",
    price: 5000000,
    pricePeriod: "year",
};

describe("property validation", () => {
    test("accepts a structured address and map coordinates", () => {
        const { error, value } = createPropertySchema.validate({
            ...baseProperty,
            streetAddress: "10 Admiralty Way",
            city: "Lekki",
            state: "Lagos",
            latitude: "6.4474",
            longitude: "3.4723",
            amenities: ["parking", "security", "waterSupply"],
            furnishingStatus: "semiFurnished",
            sizeValue: "120",
            sizeUnit: "sqm",
        });

        expect(error).toBeUndefined();
        expect(value.country).toBe("Nigeria");
        expect(value.latitude).toBe(6.4474);
        expect(value.amenities).toEqual([
            "parking",
            "security",
            "waterSupply",
        ]);
    });

    test("keeps legacy display-location creation compatible", () => {
        const { error } = createPropertySchema.validate({
            ...baseProperty,
            location: "Lekki Phase 1, Lagos",
        });

        expect(error).toBeUndefined();
    });

    test("requires latitude and longitude together", () => {
        const { error } = createPropertySchema.validate({
            ...baseProperty,
            location: "Lekki, Lagos",
            latitude: 6.4474,
        });

        expect(error).toBeDefined();
    });

    test("supports partial property updates", () => {
        const { error, value } = updatePropertySchema.validate({
            amenities: ["internet", "powerBackup"],
            parkingSpaces: "2",
        });

        expect(error).toBeUndefined();
        expect(value.parkingSpaces).toBe(2);
    });

    test("normalizes public search filters", () => {
        const { error, value } = publicPropertyQuerySchema.validate({
            city: "Lekki",
            amenities: "parking,security",
            latitude: "6.4474",
            longitude: "3.4723",
            radiusKm: "10",
            page: "2",
        });

        expect(error).toBeUndefined();
        expect(value.amenities).toEqual(["parking", "security"]);
        expect(value.radiusKm).toBe(10);
        expect(value.page).toBe(2);
    });

    test("rejects inverted price ranges", () => {
        const { error } = publicPropertyQuerySchema.validate({
            minPrice: 1000000,
            maxPrice: 500000,
        });

        expect(error).toBeDefined();
    });
});
