const mongoose = require("mongoose");

const propertyRepository = require(
    "./property.repository"
);

const {
    cloudinary,
} = require("@/shared/middleware/uploadFactory");

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
     * Editing a published listing removes it from
     * public view until an admin approves it again.
     */
    if (
        property.listingStatus === "published"
    ) {
        property.listingStatus =
            "pendingReview";

        property.submittedForReviewAt =
            new Date();

        property.reviewedAt = null;
        property.reviewedBy = null;
        property.rejectionReason = null;
        property.publishedAt = null;
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

    return propertyRepository.save(property);
};