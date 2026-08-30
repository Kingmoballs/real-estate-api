const mongoose = require("mongoose");

const propertyRepository = require(
    "./property.repository"
);

const cloudinary = require(
    "@/shared/utils/cloudinary"
);

const ApiError = require(
    "@/shared/utils/ApiError"
);

const validatePropertyId = (propertyId) => {
    if (
        !mongoose.Types.ObjectId.isValid(propertyId)
    ) {
        throw new ApiError(
            400,
            "Invalid property ID"
        );
    }
};

const escapeRegex = (value) => {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};

const getSort = (sort) => {
    const sortOptions = {
        newest: {
            createdAt: -1,
        },
        priceAsc: {
            price: 1,
            createdAt: -1,
        },
        priceDesc: {
            price: -1,
            createdAt: -1,
        },
    };

    return sortOptions[sort] || sortOptions.newest;
};

const PROPERTY_STATUS_TRANSITIONS = {
    shortlet: {
        published: ["unavailable"],
        unavailable: ["published"],
    },

    rent: {
        published: [
            "unavailable",
            "rented",
        ],
        unavailable: ["published"],
    },

    sale: {
        published: [
            "unavailable",
            "sold",
        ],
        unavailable: ["published"],
    },
};

exports.createProperty = async ({
    user,
    body,
    files,
}) => {
    if (!files || files.length === 0) {
        throw new ApiError(
            400,
            "At least one property image is required"
        );
    }

    const {
        submissionAction = "submit",
        ...propertyFields
    } = body;

    const listingStatus =
        submissionAction === "draft"
            ? "draft"
            : "pendingReview";

    const images = files.map((file) => ({
        url: file.path,
        public_id: file.filename,
    }));

    const propertyData = {
        ...propertyFields,
        images,
        listingStatus,
        submittedForReviewAt:
            listingStatus === "pendingReview"
                ? new Date()
                : null,
        postedBy: user._id,
        agentName: user.name,
        agentEmail: user.email,
        agentPhone: user.phone,
    };

    return propertyRepository.create(
        propertyData
    );
};

exports.getPublicProperties = async (
    query
) => {
    const {
        listingType,
        propertyType,
        pricePeriod,
        currency,
        location,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        sort = "newest",
        page = 1,
        limit = 20,
    } = query;

    const filters = {
        listingStatus: "published",
    };

    if (listingType) {
        filters.listingType = listingType;
    }

    if (propertyType) {
        filters.propertyType = propertyType;
    }

    if (pricePeriod) {
        filters.pricePeriod = pricePeriod;
    }

    if (currency) {
        filters.currency =
            currency.toUpperCase();
    }

    if (location) {
        filters.location = {
            $regex: escapeRegex(location),
            $options: "i",
        };
    }

    if (
        minPrice !== undefined ||
        maxPrice !== undefined
    ) {
        filters.price = {};

        if (minPrice !== undefined) {
            filters.price.$gte =
                Number(minPrice);
        }

        if (maxPrice !== undefined) {
            filters.price.$lte =
                Number(maxPrice);
        }
    }

    if (bedrooms !== undefined) {
        filters.bedrooms = {
            $gte: Number(bedrooms),
        };
    }

    if (bathrooms !== undefined) {
        filters.bathrooms = {
            $gte: Number(bathrooms),
        };
    }

    return propertyRepository.findPaginated({
        filters,
        page: Number(page),
        limit: Number(limit),
        sort: getSort(sort),
    });
};

exports.getPublicPropertyById = async (
    propertyId
) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findPublicById(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Published property not found"
        );
    }

    return property;
};

exports.getAgentProperties = async ({
    user,
    query,
}) => {
    const {
        status,
        page = 1,
        limit = 20,
    } = query;

    const filters = {
        postedBy: user._id,
    };

    if (status) {
        filters.listingStatus = status;
    }

    return propertyRepository.findPaginated({
        filters,
        page: Number(page),
        limit: Number(limit),
    });
};

exports.getAgentPropertyById = async ({
    propertyId,
    user,
}) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findByIdWithDetails(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }

    if (
        property.postedBy._id.toString() !==
        user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You do not own this property"
        );
    }

    return property;
};

exports.getAdminProperties = async (
    query
) => {
    const {
        status,
        listingType,
        page = 1,
        limit = 20,
    } = query;

    const filters = {};

    if (status) {
        filters.listingStatus = status;
    }

    if (listingType) {
        filters.listingType = listingType;
    }

    return propertyRepository.findPaginated({
        filters,
        page: Number(page),
        limit: Number(limit),
    });
};

exports.getAdminPropertyById = async (
    propertyId
) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findByIdWithDetails(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }

    return property;
};

exports.updateProperty = async ({
    propertyId,
    user,
    body,
    files,
}) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findById(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }

    if (
        property.postedBy.toString() !==
        user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You do not own this property"
        );
    }

    if (
        ["sold", "rented", "archived"].includes(
            property.listingStatus
        )
    ) {
        throw new ApiError(
            409,
            `A ${property.listingStatus} property cannot be edited`
        );
    }

    const editableFields = [
        "title",
        "description",
        "location",
        "listingType",
        "propertyType",
        "price",
        "currency",
        "pricePeriod",
        "bedrooms",
        "bathrooms",
    ];

    editableFields.forEach((field) => {
        if (body[field] !== undefined) {
            property[field] = body[field];
        }
    });

    let oldImages = [];

    if (files && files.length > 0) {
        oldImages = [...property.images];

        property.images = files.map((file) => ({
            url: file.path,
            public_id: file.filename,
        }));
    }

    /*
    * Published and temporarily unavailable listings
    * have previously passed admin review.
    *
    * If the agent changes their information, they
    * must pass admin review again.
    */
    if (
        ["published", "unavailable"].includes(
            property.listingStatus
        )
    ) {
        property.listingStatus =
            "pendingReview";

        property.submittedForReviewAt =
            new Date();

        property.reviewedAt = null;
        property.reviewedBy = null;
        property.rejectionReason = null;
        property.publishedAt = null;
        property.unavailableAt = null;
        property.statusChangedAt = new Date();
    }

    const updatedProperty =
        await propertyRepository.save(property);

    if (oldImages.length > 0) {
        await Promise.allSettled(
            oldImages.map((image) =>
                cloudinary.uploader.destroy(
                    image.public_id
                )
            )
        );
    }

    return updatedProperty;
};

exports.submitPropertyForReview = async ({
    propertyId,
    user,
}) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findById(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }

    if (
        property.postedBy.toString() !==
        user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You do not own this property"
        );
    }

    if (
        !["draft", "rejected"].includes(
            property.listingStatus
        )
    ) {
        throw new ApiError(
            409,
            `A ${property.listingStatus} property cannot be submitted for review`
        );
    }

    property.listingStatus = "pendingReview";
    property.submittedForReviewAt = new Date();
    property.statusChangedAt = new Date();
    property.reviewedAt = null;
    property.reviewedBy = null;
    property.rejectionReason = null;
    property.publishedAt = null;

    return propertyRepository.save(property);
};

exports.approveProperty = async ({
    propertyId,
    admin,
}) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findById(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }

    if (
        property.listingStatus !==
        "pendingReview"
    ) {
        throw new ApiError(
            409,
            `Only pending-review properties can be approved. Current status: ${property.listingStatus}`
        );
    }

    property.listingStatus = "published";
    property.reviewedAt = new Date();
    property.reviewedBy = admin._id;
    property.rejectionReason = null;
    property.publishedAt = new Date();
    property.statusChangedAt = new Date();

    property.unavailableAt = null;
    property.rentedAt = null;
    property.soldAt = null;

    await propertyRepository.save(property);

    return propertyRepository
        .findByIdWithDetails(propertyId);
};

exports.rejectProperty = async ({
    propertyId,
    admin,
    reason,
}) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findById(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }

    if (
        property.listingStatus !==
        "pendingReview"
    ) {
        throw new ApiError(
            409,
            `Only pending-review properties can be rejected. Current status: ${property.listingStatus}`
        );
    }

    property.listingStatus = "rejected";
    property.reviewedAt = new Date();
    property.reviewedBy = admin._id;
    property.rejectionReason = reason.trim();
    property.publishedAt = null;
    property.statusChangedAt = new Date();

    await propertyRepository.save(property);

    return propertyRepository
        .findByIdWithDetails(propertyId);
};

exports.archiveProperty = async ({
    propertyId,
    user,
}) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findById(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }

    if (
        property.postedBy.toString() !==
        user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You do not own this property"
        );
    }

    if (
        property.listingStatus === "archived"
    ) {
        throw new ApiError(
            409,
            "Property is already archived"
        );
    }

    property.listingStatus = "archived";
    property.archivedAt = new Date();
    property.statusChangedAt = new Date();

    return propertyRepository.save(property);
};

exports.updatePropertyStatus = async ({
    propertyId,
    user,
    status,
}) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findById(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }

    if (
        property.postedBy.toString() !==
        user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You do not own this property"
        );
    }

    const currentStatus =
        property.listingStatus;

    const listingTypeTransitions =
        PROPERTY_STATUS_TRANSITIONS[
            property.listingType
        ] || {};

    const allowedNextStatuses =
        listingTypeTransitions[currentStatus] || [];

    if (
        !allowedNextStatuses.includes(status)
    ) {
        const allowedMessage =
            allowedNextStatuses.length > 0
                ? allowedNextStatuses.join(", ")
                : "none";

        throw new ApiError(
            409,
            [
                `A ${property.listingType} listing`,
                `cannot move from ${currentStatus}`,
                `to ${status}.`,
                `Allowed next statuses: ${allowedMessage}.`,
            ].join(" ")
        );
    }

    const now = new Date();

    property.listingStatus = status;
    property.statusChangedAt = now;

    if (status === "unavailable") {
        property.unavailableAt = now;
    }

    if (status === "published") {
        property.unavailableAt = null;

        /*
         * Preserve the original publication date.
         * Set it only if it is unexpectedly missing.
         */
        property.publishedAt =
            property.publishedAt || now;
    }

    if (status === "rented") {
        property.rentedAt = now;
        property.unavailableAt = null;
    }

    if (status === "sold") {
        property.soldAt = now;
        property.unavailableAt = null;
    }

    await propertyRepository.save(property);

    return propertyRepository
        .findByIdWithDetails(propertyId);
};

exports.relistProperty = async ({
    propertyId,
    user,
}) => {
    validatePropertyId(propertyId);

    const property =
        await propertyRepository.findById(
            propertyId
        );

    if (!property) {
        throw new ApiError(
            404,
            "Property not found"
        );
    }

    if (
        property.postedBy.toString() !==
        user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You do not own this property"
        );
    }

    if (
        !["rented", "sold"].includes(
            property.listingStatus
        )
    ) {
        throw new ApiError(
            409,
            `A ${property.listingStatus} property cannot be relisted`
        );
    }

    if (
        property.listingType === "rent" &&
        property.listingStatus !== "rented"
    ) {
        throw new ApiError(
            409,
            "Only rented rental listings can be relisted"
        );
    }

    if (
        property.listingType === "sale" &&
        property.listingStatus !== "sold"
    ) {
        throw new ApiError(
            409,
            "Only sold sale listings can be relisted"
        );
    }

    const now = new Date();

    property.listingStatus =
        "pendingReview";

    property.submittedForReviewAt = now;
    property.statusChangedAt = now;

    property.reviewedAt = null;
    property.reviewedBy = null;
    property.rejectionReason = null;
    property.publishedAt = null;

    property.rentedAt = null;
    property.soldAt = null;
    property.unavailableAt = null;

    await propertyRepository.save(property);

    return propertyRepository
        .findByIdWithDetails(propertyId);
};