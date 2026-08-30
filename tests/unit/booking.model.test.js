const Booking = require("../../src/modules/booking/booking.model");

describe("booking model", () => {
    test("stores booking dates as MongoDB dates", () => {
        expect(Booking.schema.path("checkInDate").instance).toBe(
            "Date"
        );
        expect(Booking.schema.path("checkOutDate").instance).toBe(
            "Date"
        );
    });

    test("contains the pricing snapshot and rejection fields", () => {
        expect(Booking.schema.path("nightlyPrice")).toBeDefined();
        expect(Booking.schema.path("numberOfNights")).toBeDefined();
        expect(Booking.schema.path("currency")).toBeDefined();
        expect(
            Booking.schema.path("bookingRejectionReason")
        ).toBeDefined();
    });
});
