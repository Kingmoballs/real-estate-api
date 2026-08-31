const Review = require("./review.model");

const populateReview = (query) =>
    query
        .populate("customer", "name")
        .populate(
            "property",
            "title listingType propertyType images address listingStatus postedBy ratingAverage reviewCount"
        )
        .populate("propertyAgent", "name")
        .populate("agentResponse.respondedBy", "name role")
        .populate("moderatedBy", "name email");

exports.create = (data) => Review.create(data);

exports.save = (review) => review.save();

exports.deleteById = (reviewId) => Review.deleteOne({ _id: reviewId });

exports.findById = (reviewId) => Review.findById(reviewId);

exports.findByIdWithDetails = (reviewId) =>
    populateReview(Review.findById(reviewId));

exports.findByCustomerAndProperty = ({ customerId, propertyId }) =>
    Review.findOne({ customer: customerId, property: propertyId });

exports.findPaginated = async ({
    filters = {},
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
}) => {
    const skip = (page - 1) * limit;

    const [reviews, totalItems] = await Promise.all([
        populateReview(Review.find(filters))
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Review.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
        reviews,
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

exports.findPublicPaginated = async ({
    filters,
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
}) => {
    const skip = (page - 1) * limit;

    const publicFields = [
        "property",
        "customer",
        "rating",
        "title",
        "comment",
        "verificationSource",
        "status",
        "agentResponse",
        "createdAt",
        "updatedAt",
    ].join(" ");

    const [reviews, totalItems] = await Promise.all([
        Review.find(filters)
            .select(publicFields)
            .populate("customer", "name")
            .populate("agentResponse.respondedBy", "name role")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Review.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
        reviews,
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

exports.getPublishedRatingSummary = async (propertyId) => {
    const [summary] = await Review.aggregate([
        {
            $match: {
                property: propertyId,
                status: "published",
            },
        },
        {
            $group: {
                _id: "$property",
                ratingAverage: { $avg: "$rating" },
                reviewCount: { $sum: 1 },
            },
        },
    ]);

    return {
        ratingAverage: summary
            ? Number(summary.ratingAverage.toFixed(2))
            : 0,
        reviewCount: summary?.reviewCount || 0,
    };
};
