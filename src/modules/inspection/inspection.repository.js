const Inspection = require("./inspection.model");

const ACTIVE_STATUSES = [
    "pending",
    "confirmed",
    "rescheduleProposed",
];

const populateInspection = (query) => {
    return query
        .populate(
            "property",
            [
                "title",
                "listingType",
                "propertyType",
                "listingStatus",
                "price",
                "currency",
                "pricePeriod",
                "address",
                "images",
                "postedBy",
            ].join(" ")
        )
        .populate(
            "customer",
            "name email phone"
        )
        .populate(
            "agent",
            "name email phone"
        )
        .populate(
            "cancelledBy",
            "name email role"
        );
};

exports.create = (data) => {
    return Inspection.create(data);
};

exports.save = (inspection) => {
    return inspection.save();
};

exports.findById = (inspectionId) => {
    return Inspection.findById(inspectionId);
};

exports.findByIdWithDetails = (inspectionId) => {
    return populateInspection(
        Inspection.findById(inspectionId)
    );
};

exports.findCompletedByCustomerAndProperty = ({
    customerId,
    propertyId,
}) => {
    return Inspection.findOne({
        customer: customerId,
        property: propertyId,
        status: "completed",
    })
        .sort({ completedAt: -1, updatedAt: -1 })
        .select("_id property customer status");
};

exports.findActiveCustomerRequest = ({
    propertyId,
    customerId,
}) => {
    return Inspection.findOne({
        property: propertyId,
        customer: customerId,
        status: {
            $in: ACTIVE_STATUSES,
        },
    });
};

exports.findAgentScheduleConflict = ({
    agentId,
    scheduledFor,
    excludeInspectionId,
}) => {
    const oneHour = 60 * 60 * 1000;

    const start = new Date(
        scheduledFor.getTime() - oneHour
    );

    const end = new Date(
        scheduledFor.getTime() + oneHour
    );

    const filters = {
        agent: agentId,
        status: "confirmed",
        scheduledFor: {
            $gt: start,
            $lt: end,
        },
    };

    if (excludeInspectionId) {
        filters._id = {
            $ne: excludeInspectionId,
        };
    }

    return Inspection.exists(filters);
};

exports.findPaginated = async ({
    filters,
    page,
    limit,
}) => {
    const skip = (page - 1) * limit;

    const [inspections, totalItems] =
        await Promise.all([
            populateInspection(
                Inspection.find(filters)
            )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Inspection.countDocuments(filters),
        ]);

    const totalPages = Math.ceil(
        totalItems / limit
    );

    return {
        inspections,
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

exports.ACTIVE_STATUSES = ACTIVE_STATUSES;
