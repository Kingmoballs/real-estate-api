const Property = require("./property.model");

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
    }).populate(
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

exports.findPaginated = async ({
    filters = {},
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
}) => {
    const skip = (page - 1) * limit;

    const [properties, totalItems] =
        await Promise.all([
            Property.find(filters)
                .populate(
                    "postedBy",
                    "name email phone role"
                )
                .populate(
                    "reviewedBy",
                    "name email"
                )
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),

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