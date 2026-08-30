const {
    createBookingSchema,
    availabilityQuerySchema,
    bookingQuerySchema,
    cancelBookingSchema,
} = require("../../src/modules/booking/booking.validator");

describe("booking validation", () => {
    const property = "507f1f77bcf86cd799439011";

    test("accepts date-only booking values without converting them", () => {
        const { error, value } = createBookingSchema.validate({
            property,
            checkInDate: "2030-06-10",
            checkOutDate: "2030-06-13",
            message: "  Late arrival  ",
        });

        expect(error).toBeUndefined();
        expect(value.checkInDate).toBe("2030-06-10");
        expect(value.checkOutDate).toBe("2030-06-13");
        expect(value.message).toBe("Late arrival");
    });

    test("rejects an impossible calendar date", () => {
        const { error } = createBookingSchema.validate({
            property,
            checkInDate: "2030-02-30",
            checkOutDate: "2030-03-02",
        });

        expect(error).toBeDefined();
    });

    test("requires check-out to be after check-in", () => {
        const { error } = availabilityQuerySchema.validate({
            checkInDate: "2030-06-10",
            checkOutDate: "2030-06-10",
        });

        expect(error).toBeDefined();
    });

    test("normalizes booking list filters and pagination", () => {
        const { error, value } = bookingQuerySchema.validate({
            status: "approved",
            paymentStatus: "receiptUploaded",
            property,
            page: "2",
            limit: "25",
        });

        expect(error).toBeUndefined();
        expect(value.page).toBe(2);
        expect(value.limit).toBe(25);
    });

    test("requires a meaningful cancellation reason", () => {
        expect(
            cancelBookingSchema.validate({ reason: "" }).error
        ).toBeDefined();
        expect(
            cancelBookingSchema.validate({
                reason: "Travel plans changed",
            }).error
        ).toBeUndefined();
    });
});
