const Property = require("./property.model");

const PUBLIC_PROPERTY_EXCLUDED_FIELDS = [
    "reviewedBy",
    "reviewedAt",
    "rejectionReason",
    "submittedForReviewAt",
    "archivedAt",
    "unavailableAt",
    "rentedAt",
    "soldAt",
    "statusChangedAt",
    "__v",
]
    .map((field) => `-${field}`)
    .join(" ");

exports.findById = (id, session = null) => {
    const query = Property.findById(id);

    if (session) {
        query.session(session);
    }

    return query;
};

exports.findPublicById = (id) => {
    return Property.findOne({
        _id: id,
        listingStatus: "published",
    })
        .select(PUBLIC_PROPERTY_EXCLUDED_FIELDS)
        .populate(
            "postedBy",
            "name email phone"
        );
};

exports.findByIdWithDetails = (id) => {
    return Property.findById(id)
        .populate(
            "postedBy",
            "name email phone role"
        )
        .populate(
            "reviewedBy",
            "name email"
        );
};

exports.create = (
    propertyData,
    session = null
) => {
    const property = new Property(propertyData);

    if (session) {
        return property.save({ session });
    }

    return property.save();
};

exports.save = (
    property,
    session = null
) => {
    if (session) {
        return property.save({ session });
    }

    return property.save();
};

exports.updateRatingSummary = (propertyId, summary) => {
    return Property.findByIdAndUpdate(
        propertyId,
        {
            $set: {
                ratingAverage: summary.ratingAverage,
                reviewCount: summary.reviewCount,
            },
        },
        { new: true }
    );
};

exports.findPaginated = async ({
    filters = {},
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
    publicView = false,
}) => {
    const skip = (page - 1) * limit;

    const propertyQuery = Property.find(filters)
        .populate(
            "postedBy",
            "name email phone role"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit);

    if (publicView) {
        propertyQuery.select(
            PUBLIC_PROPERTY_EXCLUDED_FIELDS
        );
    } else {
        propertyQuery.populate(
            "reviewedBy",
            "name email"
        );
    }

    const [properties, totalItems] =
        await Promise.all([
            propertyQuery.lean(),

            Property.countDocuments(filters),
        ]);

    const totalPages = Math.ceil(
        totalItems / limit
    );

    return {
        properties,
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

exports.countByAgent = (agentId) => {
    return Property.countDocuments({
        postedBy: agentId,
        listingStatus: {
            $ne: "archived",
        },
    });
};

exports.findByAgent = (
    agentId,
    fields = []
) => {
    return Property.find({
        postedBy: agentId,
        listingStatus: {
            $ne: "archived",
        },
    }).select(fields.join(" "));
};

// Booking history must remain visible even after a property is archived.
exports.findIdsByAgent = (agentId) => {
    return Property.find({
        postedBy: agentId,
    }).select("_id");
};
