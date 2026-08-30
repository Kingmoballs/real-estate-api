const mockSession = {
    withTransaction: jest.fn(async (callback) => callback()),
    endSession: jest.fn().mockResolvedValue(undefined),
};

jest.mock("mongoose", () => ({
    startSession: jest.fn(async () => mockSession),
    isValidObjectId: jest.fn(() => true),
}));

jest.mock("../../src/modules/booking/booking.repository", () => ({
    findConflictingBooking: jest.fn(),
    create: jest.fn(),
}));

jest.mock("../../src/modules/property/property.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("@/shared/utils/redisLock", () => ({
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
}));

jest.mock("@/shared/events/eventBus", () => ({
    emit: jest.fn(),
}));

const bookingRepository = require("../../src/modules/booking/booking.repository");
const propertyRepository = require("../../src/modules/property/property.repository");
const {
    acquireLock,
    releaseLock,
} = require("../../src/shared/utils/redisLock");
const bookingService = require("../../src/modules/booking/booking.service");

describe("booking service creation", () => {
    const propertyId = "507f1f77bcf86cd799439011";
    const agentId = "507f191e810c19729de860ea";
    const userId = "507f191e810c19729de860eb";
    const user = {
        _id: userId,
        name: "Test Guest",
        email: "guest@example.com",
        phone: "+2348000000000",
    };
    const property = {
        _id: propertyId,
        postedBy: agentId,
        listingType: "shortlet",
        listingStatus: "published",
        pricePeriod: "night",
        price: 50000,
        currency: "NGN",
    };

    beforeEach(() => {
        mockSession.withTransaction.mockImplementation(
            async (callback) => callback()
        );
        acquireLock.mockResolvedValue("lock-token");
        releaseLock.mockResolvedValue(1);
        propertyRepository.findById.mockResolvedValue(property);
        bookingRepository.findConflictingBooking.mockResolvedValue(
            null
        );
        bookingRepository.create.mockImplementation(
            async (data) => ({ _id: "booking-id", ...data })
        );
    });

    test("uses a property-wide lock and stores a pricing snapshot", async () => {
        const booking = await bookingService.createBooking({
            user,
            payload: {
                property: propertyId,
                checkInDate: "2030-06-10",
                checkOutDate: "2030-06-13",
                message: "Late arrival",
            },
        });

        expect(acquireLock).toHaveBeenCalledWith(
            `booking:property:${propertyId}`
        );
        expect(bookingRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                nightlyPrice: 50000,
                numberOfNights: 3,
                currency: "NGN",
                totalPrice: 150000,
                checkInDate: new Date(
                    "2030-06-10T00:00:00.000Z"
                ),
                checkOutDate: new Date(
                    "2030-06-13T00:00:00.000Z"
                ),
            }),
            mockSession
        );
        expect(releaseLock).toHaveBeenCalledWith(
            `booking:property:${propertyId}`,
            "lock-token"
        );
        expect(booking.totalPrice).toBe(150000);
    });

    test("rejects an overlapping range and still releases the lock", async () => {
        bookingRepository.findConflictingBooking.mockResolvedValue({
            _id: "existing-booking",
        });

        await expect(
            bookingService.createBooking({
                user,
                payload: {
                    property: propertyId,
                    checkInDate: "2030-06-10",
                    checkOutDate: "2030-06-13",
                    message: "",
                },
            })
        ).rejects.toMatchObject({ statusCode: 409 });

        expect(bookingRepository.create).not.toHaveBeenCalled();
        expect(releaseLock).toHaveBeenCalledWith(
            `booking:property:${propertyId}`,
            "lock-token"
        );
    });
});
