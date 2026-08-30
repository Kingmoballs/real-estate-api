const {
    parseDateOnly,
    calculateNights,
    shouldActivateBooking,
    buildPropertyBookingLockKey,
} = require("../../src/shared/utils/bookingUtils");

describe("booking utilities", () => {
    test("parses only real YYYY-MM-DD calendar dates", () => {
        expect(
            parseDateOnly("2032-02-29").toISOString()
        ).toBe("2032-02-29T00:00:00.000Z");
        expect(parseDateOnly("2031-02-29")).toBeNull();
        expect(parseDateOnly("29/02/2032")).toBeNull();
    });

    test("calculates the number of nights", () => {
        expect(
            calculateNights("2030-12-30", "2031-01-02")
        ).toBe(3);
        expect(
            calculateNights("2030-12-30", "2030-12-30")
        ).toBe(0);
    });

    test("activates a booking on or after its check-in day", () => {
        const now = new Date("2030-06-10T18:30:00.000Z");

        expect(
            shouldActivateBooking("2030-06-10", now)
        ).toBe(true);
        expect(
            shouldActivateBooking("2030-06-11", now)
        ).toBe(false);
    });

    test("builds a property-wide booking lock key", () => {
        expect(buildPropertyBookingLockKey("property-123")).toBe(
            "booking:property:property-123"
        );
    });
});
