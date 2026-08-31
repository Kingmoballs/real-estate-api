const Booking = require("./booking.model");

const BLOCKING_STATUSES = ["pending", "approved", "active"];

const withSession = (query, session) => {
    if (session) {
        query.session(session);
    }

    return query;
};

const populateDetails = (query) =>
    query
        .populate(
            "property",
            "title location images listingType propertyType price currency pricePeriod listingStatus postedBy"
        )
        .populate("guest", "name email phone role");

const findPaginated = async ({ filters, page, limit }) => {
    const skip = (page - 1) * limit;

    const [bookings, totalItems] = await Promise.all([
        populateDetails(
            Booking.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
        ).lean(),
        Booking.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
        bookings,
        pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

exports.BLOCKING_STATUSES = BLOCKING_STATUSES;

exports.findConflictingBooking = ({
    property,
    start,
    end,
    statuses = BLOCKING_STATUSES,
    session,
}) => {
    const query = Booking.findOne({
        property,
        bookingStatus: { $in: statuses },
        checkInDate: { $lt: end },
        checkOutDate: { $gt: start },
    });

    return withSession(query, session);
};

exports.findBlockedRanges = ({
    property,
    start,
    end,
}) => {
    return Booking.find({
        property,
        bookingStatus: { $in: BLOCKING_STATUSES },
        checkInDate: { $lt: end },
        checkOutDate: { $gt: start },
    })
        .select("checkInDate checkOutDate bookingStatus")
        .sort({ checkInDate: 1 })
        .lean();
};

exports.findByIdWithProperty = (bookingId, session = null) => {
    const query = Booking.findById(bookingId).populate("property");
    return withSession(query, session);
};

exports.findByIdWithDetails = (bookingId, session = null) => {
    const query = populateDetails(Booking.findById(bookingId));
    return withSession(query, session);
};

exports.findById = (bookingId, session = null) => {
    return withSession(Booking.findById(bookingId), session);
};

exports.findCompletedByGuestAndProperty = ({
    guestId,
    propertyId,
}) => {
    return Booking.findOne({
        guest: guestId,
        property: propertyId,
        bookingStatus: "completed",
    })
        .sort({ updatedAt: -1 })
        .select("_id property guest bookingStatus");
};

exports.findByUser = ({ userId, filters, page, limit }) => {
    return findPaginated({
        filters: { ...filters, guest: userId },
        page,
        limit,
    });
};

exports.findByProperties = ({ propertyIds, filters, page, limit }) => {
    return findPaginated({
        filters: {
            ...filters,
            property: { $in: propertyIds },
        },
        page,
        limit,
    });
};

exports.findAll = ({ filters, page, limit }) => {
    return findPaginated({ filters, page, limit });
};

exports.approve = (booking, { paymentDueAt }, session = null) => {
    booking.bookingStatus = "approved";
    booking.approvedAt = new Date();
    booking.paymentDueAt = paymentDueAt;
    booking.requestExpiresAt = null;
    return booking.save(session ? { session } : undefined);
};

exports.reject = (booking, reason, session = null) => {
    booking.bookingStatus = "rejected";
    booking.bookingRejectionReason = reason;
    booking.rejectedAt = new Date();
    booking.requestExpiresAt = null;
    return booking.save(session ? { session } : undefined);
};

exports.cancel = (
    booking,
    { reason, cancelledBy, actorRole },
    session = null
) => {
    booking.bookingStatus = "cancelled";
    booking.bookingCancelledAt = new Date();
    booking.bookingCancellationReason = reason;
    booking.cancelledBy = cancelledBy;
    booking.cancellationActorRole = actorRole;
    booking.requestExpiresAt = null;
    booking.paymentDueAt = null;
    booking.receiptReuploadDeadline = null;
    return booking.save(session ? { session } : undefined);
};

exports.uploadReceipt = (
    booking,
    receiptPath,
    session = null
) => {
    booking.paymentReceipt = receiptPath;
    booking.paymentStatus = "receiptUploaded";
    booking.receiptUploadedAt = new Date();
    booking.receiptRejectionReason = null;
    booking.receiptRejectedAt = null;
    booking.receiptReuploadDeadline = null;
    return booking.save(session ? { session } : undefined);
};

exports.verifyPaymentReceipt = (booking, { activate }) => {
    booking.paymentStatus = "verified";
    booking.receiptVerifiedAt = new Date();
    booking.paymentDueAt = null;
    booking.receiptReuploadDeadline = null;

    if (activate) {
        booking.bookingStatus = "active";
    }

    return booking.save();
};

exports.rejectPaymentReceipt = (
    booking,
    { reason, reuploadDeadline }
) => {
    booking.paymentStatus = "rejected";
    booking.receiptRejectionReason =
        reason || "Invalid or unclear receipt";
    booking.receiptRejectedAt = new Date();
    booking.receiptReuploadDeadline = reuploadDeadline;
    return booking.save();
};

exports.create = async (data, session = null) => {
    if (session) {
        const [booking] = await Booking.create([data], { session });
        return booking;
    }

    return Booking.create(data);
};

exports.save = (booking) => booking.save();

exports.countByProperties = (propertyIds) => {
    return Booking.countDocuments({
        property: { $in: propertyIds },
        bookingStatus: {
            $nin: ["rejected", "cancelled", "expired"],
        },
    });
};

exports.calculateTotalRevenue = async (propertyIds) => {
    const result = await Booking.aggregate([
        {
            $match: {
                property: { $in: propertyIds },
                paymentStatus: "verified",
            },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    return result.length ? result[0].total : 0;
};

exports.getPropertyStats = (propertyIds) => {
    return Booking.aggregate([
        {
            $match: {
                property: { $in: propertyIds },
                bookingStatus: {
                    $nin: ["rejected", "cancelled", "expired"],
                },
            },
        },
        {
            $group: {
                _id: "$property",
                bookingCount: { $sum: 1 },
                totalRevenue: {
                    $sum: {
                        $cond: [
                            { $eq: ["$paymentStatus", "verified"] },
                            "$totalPrice",
                            0,
                        ],
                    },
                },
            },
        },
    ]);
};

exports.getStatsByDateRange = ({ propertyIds, startDate, endDate }) => {
    return Booking.aggregate([
        {
            $match: {
                property: { $in: propertyIds },
                createdAt: { $gte: startDate, $lte: endDate },
                bookingStatus: {
                    $nin: ["rejected", "cancelled", "expired"],
                },
            },
        },
        {
            $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                totalRevenue: {
                    $sum: {
                        $cond: [
                            { $eq: ["$paymentStatus", "verified"] },
                            "$totalPrice",
                            0,
                        ],
                    },
                },
            },
        },
    ]);
};
