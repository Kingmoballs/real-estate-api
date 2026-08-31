const Property = require("../../src/modules/property/property.model");

describe("property model", () => {
    test("stores GeoJSON in longitude-latitude order", () => {
        const property = new Property({
            geoLocation: {
                type: "Point",
                coordinates: [3.4723, 6.4474],
            },
        });

        expect(property.geoLocation.type).toBe("Point");
        expect(property.geoLocation.coordinates).toEqual([
            3.4723,
            6.4474,
        ]);
        expect(Property.schema.path("geoLocation")).toBeDefined();
    });

    test("does not create malformed GeoJSON for legacy listings", () => {
        const property = new Property({ location: "Lagos" });

        expect(property.geoLocation).toBeUndefined();
    });

    test("defines the structured search indexes", () => {
        const indexes = Property.schema.indexes();

        expect(
            indexes.some(
                ([fields]) => fields.geoLocation === "2dsphere"
            )
        ).toBe(true);
        expect(
            indexes.some(
                ([fields]) => fields["address.city"] === 1
            )
        ).toBe(true);
    });
});
