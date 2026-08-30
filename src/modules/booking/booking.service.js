const mongoose = require("mongoose");
const bookingRepository = require("./booking.repository");
const propertyRepository = require("../property/property.repository");
const { acquireLock, releaseLock } = require("@/shared/utils/redisLock");
const {
    parseDateOnly,
    startOfUtcDay,
    calculateNights,
    shouldActivateBooking,
    buildPropertyBookingLockKey,
} = require("@/shared/utils/bookingUtils");
const ApiError = require("@/shared/utils/ApiError");
const eventBus = require("@/shared/events/eventBus");
const EVENTS = require("@/shared/events/eventRegistry");
const {
    PENDING_BOOKING_TIMEOUT_HOURS,
    PAYMENT_TIMEOUT_HOURS,
    REUPLOAD_TIMEOUT_HOURS,
} = require("@/config/bookingRules");

const MS_PER_HOUR = 60 * 60 * 1000;

const runInTransaction = async (work) => {
    const session = await mongoose.startSession();
    let result;

    try {
        await session.withTransaction(async () => {
            result = await work(session);
        });

        return result;
    } finally {
        await session.endSession();
    }
};

const sameId = (first, second) =>
    Boolean(first && second) &&
    first.toString() === second.toString();

const getReferenceId = (reference) =>
    reference?._id || reference;

const validatePropertyId = (propertyId) => {
    if (!mongoose.isValidObjectId(propertyId)) {
        throw new ApiError(400, "Invalid property ID");
    }
};

const ensureBookableProperty = (property) => {
    if (
        !property ||
        property.listingType !== "shortlet" ||
        property.listingStatus !== "published" ||
        property.pricePeriod !== "night"
    ) {
        throw new ApiError(
            400,
            "Only published shortlet properties priced per night can be booked"
        );
    }
};

const parseBookingRange = ({
    checkInDate,
    checkOutDate,
    rejectPastDates = true,
}) => {
    const start = parseDateOnly(checkInDate);
    const end = parseDateOnly(checkOutDate);
    const numberOfNights = calculateNights(
        checkInDate,
        checkOutDate
    );

    if (!start || !end || numberOfNights < 1) {
        throw new ApiError(
            400,
            "Check-out date must be after check-in date"
        );
    }

    if (rejectPastDates && start < startOfUtcDay()) {
        throw new ApiError(
            400,
            "Check-in date cannot be in the past"
        );
    }

    return { start, end, numberOfNights };
};

const buildFilters = ({ status, paymentStatus, property }) => {
    const filters = {};

    if (status) {
        filters.bookingStatus = status;
    }

    if (paymentStatus) {
        filters.paymentStatus = paymentStatus;
    }

    if (property) {
        filters.property = property;
    }

    return filters;
};

exports.createBooking = async ({ user, payload }) => {
    const { property, checkInDate, checkOutDate, message } = payload;
    const lockKey = buildPropertyBookingLockKey(property);
    let lockToken;

    try {
        // Lock the whole property, not just an exact date pair. This makes
        // overlapping range checks safe across concurrent API requests.
        lockToken = await acquireLock(lockKey);

        const result = await runInTransaction(async (session) => {
            const apartment = await propertyRepository.findById(
                property,
                session
            );

            ensureBookableProperty(apartment);

            if (sameId(apartment.postedBy, user._id)) {
                throw new ApiError(
                    400,
                    "You cannot book your own property"
                );
            }

            const { start, end, numberOfNights } =
                parseBookingRange({
                    checkInDate,
                    checkOutDate,
                });

            const conflict =
                await bookingRepository.findConflictingBooking({
                    property,
                    start,
                    end,
                    session,
                });

            if (conflict) {
                throw new ApiError(
                    409,
                    "Property is not available for the selected dates"
                );
            }

            const requestExpiresAt = new Date(
                Date.now() +
                    PENDING_BOOKING_TIMEOUT_HOURS * MS_PER_HOUR
            );

            const booking = await bookingRepository.create(
                {
                    property,
                    guest: user._id,
                    guestName: user.name,
                    guestEmail: user.email,
                    guestPhone: user.phone,
                    checkInDate: start,
                    checkOutDate: end,
                    nightlyPrice: apartment.price,
                    numberOfNights,
                    currency: apartment.currency,
                    totalPrice: numberOfNights * apartment.price,
                    message,
                    bookingStatus: "pending",
                    paymentStatus: "unpaid",
                    requestExpiresAt,
                },
                session
            );

            return { booking, apartment };
        });

        eventBus.emit(EVENTS.BOOKING_CREATED, {
            bookingId: result.booking._id,
            agentId: result.apartment.postedBy,
            guestName: user.name,
            propertyId: property,
        });

        return result.booking;
    } finally {
        if (lockToken) {
            await releaseLock(lockKey, lockToken).catch((error) => {
                console.error(
                    "Failed to release booking lock:",
                    error.message
                );
            });
        }
    }
};

exports.checkAvailability = async ({ propertyId, query }) => {
    validatePropertyId(propertyId);

    const property = await propertyRepository.findById(propertyId);
    ensureBookableProperty(property);

    const { start, end } = parseBookingRange({
        checkInDate: query.checkInDate,
        checkOutDate: query.checkOutDate,
    });

    const conflict = await bookingRepository.findConflictingBooking({
        property: propertyId,
        start,
        end,
    });

    return {
        propertyId,
        checkInDate: query.checkInDate,
        checkOutDate: query.checkOutDate,
        available: !conflict,
    };
};

exports.getAvailabilityCalendar = async ({ propertyId, query }) => {
    validatePropertyId(propertyId);

    const property = await propertyRepository.findById(propertyId);
    ensureBookableProperty(property);

    const { start, end, numberOfNights } = parseBookingRange({
        checkInDate: query.from,
        checkOutDate: query.to,
    });

    if (numberOfNights > 366) {
        throw new ApiError(
            400,
            "Availability calendar range cannot exceed 366 days"
        );
    }

    const ranges = await bookingRepository.findBlockedRanges({
        property: propertyId,
        start,
        end,
    });

    return {
        propertyId,
        from: query.from,
        to: query.to,
        blockedRanges: ranges.map((range) => ({
            checkInDate: range.checkInDate
                .toISOString()
                .slice(0, 10),
            checkOutDate: range.checkOutDate
                .toISOString()
                .slice(0, 10),
            status: range.bookingStatus,
        })),
    };
};

exports.approveBooking = async ({ bookingId, agent }) => {
    const booking = await runInTransaction(async (session) => {
        const current = await bookingRepository.findByIdWithProperty(
            bookingId,
            session
        );

        if (!current) {
            throw new ApiError(404, "Booking not found");
        }

        if (!sameId(current.property?.postedBy, agent._id)) {
            throw new ApiError(
                403,
                "You are not authorized to approve this booking"
            );
        }

        if (current.bookingStatus !== "pending") {
            throw new ApiError(
                400,
                `Booking cannot be approved. Current status: ${current.bookingStatus}`
            );
        }

        if (current.checkInDate < startOfUtcDay()) {
            throw new ApiError(
                409,
                "This booking cannot be approved because its check-in date has passed"
            );
        }

        const paymentDueAt = new Date(
            Date.now() + PAYMENT_TIMEOUT_HOURS * MS_PER_HOUR
        );

        return bookingRepository.approve(
            current,
            { paymentDueAt },
            session
        );
    });

    eventBus.emit(EVENTS.BOOKING_APPROVED, {
        bookingId: booking._id,
        guestId: booking.guest,
        agentId: agent._id,
        propertyId: booking.property._id,
    });

    return booking;
};

exports.rejectBooking = async ({ bookingId, agent, reason }) => {
    const booking = await runInTransaction(async (session) => {
        const current = await bookingRepository.findByIdWithProperty(
            bookingId,
            session
        );

        if (!current) {
            throw new ApiError(404, "Booking not found");
        }

        if (!sameId(current.property?.postedBy, agent._id)) {
            throw new ApiError(
                403,
                "You are not authorized to reject this booking"
            );
        }

        if (current.bookingStatus !== "pending") {
            throw new ApiError(
                400,
                `Booking cannot be rejected. Current status: ${current.bookingStatus}`
            );
        }

        return bookingRepository.reject(
            current,
            reason,
            session
        );
    });

    eventBus.emit(EVENTS.BOOKING_REJECTED, {
        bookingId: booking._id,
        guestId: booking.guest,
        agentId: agent._id,
        propertyId: booking.property._id,
        reason,
    });

    return booking;
};

exports.cancelBooking = async ({ bookingId, user, reason }) => {
    const result = await runInTransaction(async (session) => {
        const booking = await bookingRepository.findByIdWithProperty(
            bookingId,
            session
        );

        if (!booking) {
            throw new ApiError(404, "Booking not found");
        }

        const isGuest = sameId(booking.guest, user._id);
        const isPropertyOwner = sameId(
            booking.property?.postedBy,
            user._id
        );
        const isAdmin = user.role === "admin";

        if (!isGuest && !isPropertyOwner && !isAdmin) {
            throw new ApiError(
                403,
                "You are not authorized to cancel this booking"
            );
        }

        if (!["pending", "approved"].includes(booking.bookingStatus)) {
            throw new ApiError(
                400,
                `A ${booking.bookingStatus} booking cannot be cancelled`
            );
        }

        if (
            ["receiptUploaded", "verified"].includes(
                booking.paymentStatus
            )
        ) {
            throw new ApiError(
                409,
                "This booking has a submitted or verified payment and requires manual support review"
            );
        }

        const updated = await bookingRepository.cancel(
            booking,
            {
                reason,
                cancelledBy: user._id,
                actorRole: user.role,
            },
            session
        );

        const recipientId = isGuest
            ? booking.property.postedBy
            : booking.guest;

        return { booking: updated, recipientId, isGuest };
    });

    eventBus.emit(EVENTS.BOOKING_CANCELLED, {
        bookingId: result.booking._id,
        recipientId: result.recipientId,
        cancelledByGuest: result.isGuest,
        guestName: result.booking.guestName,
        reason,
    });

    return result.booking;
};

exports.uploadPaymentReceipt = async ({ bookingId, user, file }) => {
    const booking = await runInTransaction(async (session) => {
        const current = await bookingRepository.findByIdWithProperty(
            bookingId,
            session
        );

        if (!current) {
            throw new ApiError(404, "Booking not found");
        }

        if (!sameId(current.guest, user._id)) {
            throw new ApiError(
                403,
                "You are not authorized to upload a receipt for this booking"
            );
        }

        if (current.bookingStatus !== "approved") {
            throw new ApiError(
                400,
                "A receipt can only be uploaded for an approved booking"
            );
        }

        if (current.paymentStatus === "verified") {
            throw new ApiError(400, "Payment is already verified");
        }

        if (current.paymentStatus === "receiptUploaded") {
            throw new ApiError(400, "A receipt is already awaiting review");
        }

        if (
            current.paymentStatus === "unpaid" &&
            current.paymentDueAt &&
            current.paymentDueAt < new Date()
        ) {
            throw new ApiError(
                410,
                "The payment window for this booking has expired"
            );
        }

        if (
            current.paymentStatus === "rejected" &&
            (!current.receiptReuploadDeadline ||
                current.receiptReuploadDeadline < new Date())
        ) {
            throw new ApiError(
                410,
                "The receipt re-upload window has expired"
            );
        }

        if (!file?.path) {
            throw new ApiError(
                400,
                "Payment receipt file is required"
            );
        }

        return bookingRepository.uploadReceipt(
            current,
            file.path,
            session
        );
    });

    eventBus.emit(EVENTS.BOOKING_RECEIPT_UPLOADED, {
        bookingId: booking._id,
        agentId: booking.property.postedBy,
        guestId: booking.guest,
        guestName: booking.guestName,
        propertyId: booking.property._id,
    });

    return booking;
};

exports.verifyPaymentReceipt = async ({ bookingId, user }) => {
    const booking = await bookingRepository.findByIdWithProperty(
        bookingId
    );

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const isAgentOwner = sameId(
        booking.property?.postedBy,
        user._id
    );

    if (!isAgentOwner && user.role !== "admin") {
        throw new ApiError(
            403,
            "You are not authorized to verify this receipt"
        );
    }

    if (booking.bookingStatus !== "approved") {
        throw new ApiError(
            400,
            `Cannot verify payment for a ${booking.bookingStatus} booking`
        );
    }

    if (booking.paymentStatus !== "receiptUploaded") {
        throw new ApiError(
            400,
            `Cannot verify receipt. Current status: ${booking.paymentStatus}`
        );
    }

    if (booking.checkOutDate <= startOfUtcDay()) {
        throw new ApiError(
            410,
            "This booking has already passed its check-out date"
        );
    }

    const activate = shouldActivateBooking(booking.checkInDate);
    const updatedBooking =
        await bookingRepository.verifyPaymentReceipt(booking, {
            activate,
        });

    eventBus.emit(EVENTS.BOOKING_PAYMENT_VERIFIED, {
        bookingId: booking._id,
        guestId: booking.guest,
        agentId: user._id,
        propertyId: booking.property._id,
        activated: activate,
    });

    return updatedBooking;
};

exports.rejectPaymentReceipt = async ({
    bookingId,
    user,
    reason,
}) => {
    const booking = await bookingRepository.findByIdWithProperty(
        bookingId
    );

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const isAgentOwner = sameId(
        booking.property?.postedBy,
        user._id
    );

    if (!isAgentOwner && user.role !== "admin") {
        throw new ApiError(
            403,
            "You are not authorized to reject this receipt"
        );
    }

    if (
        booking.bookingStatus !== "approved" ||
        booking.paymentStatus !== "receiptUploaded"
    ) {
        throw new ApiError(
            400,
            "Only an uploaded receipt for an approved booking can be rejected"
        );
    }

    const reuploadDeadline = new Date(
        Date.now() + REUPLOAD_TIMEOUT_HOURS * MS_PER_HOUR
    );
    const updatedBooking =
        await bookingRepository.rejectPaymentReceipt(booking, {
            reason,
            reuploadDeadline,
        });

    eventBus.emit(EVENTS.BOOKING_PAYMENT_REJECTED, {
        bookingId: booking._id,
        guestId: booking.guest,
        agentId: user._id,
        propertyId: booking.property._id,
        reason,
    });

    return updatedBooking;
};

exports.getUserBookings = ({ user, query }) => {
    return bookingRepository.findByUser({
        userId: user._id,
        filters: buildFilters(query),
        page: query.page,
        limit: query.limit,
    });
};

exports.getAgentBookings = async ({ agent, query }) => {
    const properties = await propertyRepository.findIdsByAgent(
        agent._id
    );
    const propertyIds = properties.map((property) => property._id);

    if (
        query.property &&
        !propertyIds.some((id) => sameId(id, query.property))
    ) {
        throw new ApiError(
            403,
            "You can only view bookings for your own properties"
        );
    }

    const filters = buildFilters(query);
    delete filters.property;

    return bookingRepository.findByProperties({
        propertyIds: query.property
            ? [query.property]
            : propertyIds,
        filters,
        page: query.page,
        limit: query.limit,
    });
};

exports.getAdminBookings = ({ query }) => {
    return bookingRepository.findAll({
        filters: buildFilters(query),
        page: query.page,
        limit: query.limit,
    });
};

exports.getBookingById = async ({ bookingId, user }) => {
    const booking = await bookingRepository.findByIdWithDetails(
        bookingId
    );

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const guestId = getReferenceId(booking.guest);
    const propertyOwnerId = getReferenceId(
        booking.property?.postedBy
    );
    const canView =
        user.role === "admin" ||
        sameId(guestId, user._id) ||
        sameId(propertyOwnerId, user._id);

    if (!canView) {
        throw new ApiError(
            403,
            "You are not authorized to view this booking"
        );
    }

    return booking;
};
