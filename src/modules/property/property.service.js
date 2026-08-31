const mongoose = require("mongoose");
const propertyRepository = require("./property.repository");
const cloudinary = require("@/shared/utils/cloudinary");
const ApiError = require("@/shared/utils/ApiError");

const EARTH_RADIUS_KM = 6378.1;

const PROPERTY_STATUS_TRANSITIONS = {
    shortlet: {
        published: ["unavailable"],
        unavailable: ["published"],
    },
    rent: {
        published: ["unavailable", "rented"],
        unavailable: ["published"],
    },
    sale: {
        published: ["unavailable", "sold"],
        unavailable: ["published"],
    },
};

const validatePropertyId = (propertyId) => {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        throw new ApiError(400, "Invalid property ID");
    }
};

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactTextFilter = (value) => ({
    $regex: `^${escapeRegex(value)}$`,
    $options: "i",
});

const getSort = (sort) => {
    const options = {
        newest: { createdAt: -1 },
        priceAsc: { price: 1, createdAt: -1 },
        priceDesc: { price: -1, createdAt: -1 },
        topRated: {
            ratingAverage: -1,
            reviewCount: -1,
            createdAt: -1,
        },
    };

    return options[sort] || options.newest;
};

const buildDisplayLocation = (address = {}) =>
    [
        address.streetAddress,
        address.lga,
        address.city,
        address.state,
        address.country,
    ]
        .filter(Boolean)
        .join(", ");

const mapCreatePropertyFields = (body) => {
    const {
        streetAddress,
        city,
        state,
        lga,
        country,
        postalCode,
        latitude,
        longitude,
        sizeValue,
        sizeUnit,
        ...fields
    } = body;

    const address = {
        streetAddress: streetAddress || "",
        city: city || "",
        state: state || "",
        lga: lga || "",
        country: country || "Nigeria",
        postalCode: postalCode || "",
    };

    fields.address = address;

    if (!fields.location && city) {
        fields.location = buildDisplayLocation(address);
    }

    if (
        latitude !== undefined &&
        longitude !== undefined
    ) {
        fields.geoLocation = {
            type: "Point",
            // GeoJSON always uses [longitude, latitude].
            coordinates: [longitude, latitude],
        };
    }

    if (sizeValue !== undefined) {
        fields.size = {
            value: sizeValue,
            unit: sizeUnit,
        };
    }

    return fields;
};

const ensureOwnedProperty = (property, user) => {
    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    if (property.postedBy.toString() !== user._id.toString()) {
        throw new ApiError(403, "You do not own this property");
    }
};

exports.createProperty = async ({ user, body, files }) => {
    if (!files || files.length === 0) {
        throw new ApiError(
            400,
            "At least one property image is required"
        );
    }

    const {
        submissionAction = "submit",
        ...rawPropertyFields
    } = body;
    const propertyFields = mapCreatePropertyFields(
        rawPropertyFields
    );
    const listingStatus =
        submissionAction === "draft"
            ? "draft"
            : "pendingReview";
    const images = files.map((file) => ({
        url: file.path,
        public_id: file.filename,
    }));

    return propertyRepository.create({
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
    });
};

exports.getPublicProperties = async (query) => {
    const {
        listingType,
        propertyType,
        pricePeriod,
        currency,
        search,
        location,
        city,
        state,
        lga,
        country,
        amenities,
        furnishingStatus,
        sizeUnit,
        minSize,
        maxSize,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        parkingSpaces,
        latitude,
        longitude,
        radiusKm,
        sort = "newest",
        page = 1,
        limit = 20,
    } = query;

    const filters = { listingStatus: "published" };

    if (listingType) filters.listingType = listingType;
    if (propertyType) filters.propertyType = propertyType;
    if (pricePeriod) filters.pricePeriod = pricePeriod;
    if (currency) filters.currency = currency.toUpperCase();

    if (search) {
        filters.$text = { $search: search };
    }

    if (location) {
        filters.location = {
            $regex: escapeRegex(location),
            $options: "i",
        };
    }

    if (city) filters["address.city"] = exactTextFilter(city);
    if (state) filters["address.state"] = exactTextFilter(state);
    if (lga) filters["address.lga"] = exactTextFilter(lga);
    if (country) {
        filters["address.country"] = exactTextFilter(country);
    }

    if (amenities?.length) {
        filters.amenities = { $all: amenities };
    }

    if (furnishingStatus) {
        filters.furnishingStatus = furnishingStatus;
    }

    if (sizeUnit) filters["size.unit"] = sizeUnit;

    if (minSize !== undefined || maxSize !== undefined) {
        filters["size.value"] = {};
        if (minSize !== undefined) {
            filters["size.value"].$gte = minSize;
        }
        if (maxSize !== undefined) {
            filters["size.value"].$lte = maxSize;
        }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filters.price = {};
        if (minPrice !== undefined) filters.price.$gte = minPrice;
        if (maxPrice !== undefined) filters.price.$lte = maxPrice;
    }

    if (bedrooms !== undefined) {
        filters.bedrooms = { $gte: bedrooms };
    }
    if (bathrooms !== undefined) {
        filters.bathrooms = { $gte: bathrooms };
    }
    if (parkingSpaces !== undefined) {
        filters.parkingSpaces = { $gte: parkingSpaces };
    }

    if (
        latitude !== undefined &&
        longitude !== undefined &&
        radiusKm !== undefined
    ) {
        filters.geoLocation = {
            $geoWithin: {
                $centerSphere: [
                    [longitude, latitude],
                    radiusKm / EARTH_RADIUS_KM,
                ],
            },
        };
    }

    return propertyRepository.findPaginated({
        filters,
        page,
        limit,
        sort: getSort(sort),
    });
};

exports.getPublicPropertyById = async (propertyId) => {
    validatePropertyId(propertyId);
    const property = await propertyRepository.findPublicById(
        propertyId
    );

    if (!property) {
        throw new ApiError(404, "Published property not found");
    }

    return property;
};

exports.getAgentProperties = async ({ user, query }) => {
    const {
        status,
        listingType,
        propertyType,
        city,
        page = 1,
        limit = 20,
    } = query;
    const filters = { postedBy: user._id };

    if (status) filters.listingStatus = status;
    if (listingType) filters.listingType = listingType;
    if (propertyType) filters.propertyType = propertyType;
    if (city) filters["address.city"] = exactTextFilter(city);

    return propertyRepository.findPaginated({
        filters,
        page,
        limit,
    });
};

exports.getAgentPropertyById = async ({ propertyId, user }) => {
    validatePropertyId(propertyId);
    const property = await propertyRepository.findByIdWithDetails(
        propertyId
    );

    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    if (property.postedBy._id.toString() !== user._id.toString()) {
        throw new ApiError(403, "You do not own this property");
    }

    return property;
};

exports.getAdminProperties = async (query) => {
    const {
        status,
        listingType,
        propertyType,
        city,
        state,
        page = 1,
        limit = 20,
    } = query;
    const filters = {};

    if (status) filters.listingStatus = status;
    if (listingType) filters.listingType = listingType;
    if (propertyType) filters.propertyType = propertyType;
    if (city) filters["address.city"] = exactTextFilter(city);
    if (state) filters["address.state"] = exactTextFilter(state);

    return propertyRepository.findPaginated({
        filters,
        page,
        limit,
    });
};

exports.getAdminPropertyById = async (propertyId) => {
    validatePropertyId(propertyId);
    const property = await propertyRepository.findByIdWithDetails(
        propertyId
    );

    if (!property) {
        throw new ApiError(404, "Property not found");
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
    const property = await propertyRepository.findById(propertyId);
    ensureOwnedProperty(property, user);

    if (["sold", "rented", "archived"].includes(property.listingStatus)) {
        throw new ApiError(
            409,
            `A ${property.listingStatus} property cannot be edited`
        );
    }

    const simpleFields = [
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
        "furnishingStatus",
        "amenities",
        "parkingSpaces",
        "yearBuilt",
        "serviceCharge",
        "securityDeposit",
        "cleaningFee",
    ];

    for (const field of simpleFields) {
        if (body[field] !== undefined) {
            property[field] = body[field];
        }
    }

    const addressFields = [
        "streetAddress",
        "city",
        "state",
        "lga",
        "country",
        "postalCode",
    ];
    let addressChanged = false;

    for (const field of addressFields) {
        if (body[field] !== undefined) {
            property.address[field] = body[field];
            addressChanged = true;
        }
    }

    if (addressChanged && body.location === undefined) {
        property.location = buildDisplayLocation(property.address);
    }

    if (
        body.latitude !== undefined &&
        body.longitude !== undefined
    ) {
        property.geoLocation = {
            type: "Point",
            coordinates: [body.longitude, body.latitude],
        };
    }

    if (body.sizeValue !== undefined) {
        property.size = {
            value: body.sizeValue,
            unit: body.sizeUnit,
        };
    }

    let oldImages = [];

    if (files?.length) {
        oldImages = [...property.images];
        property.images = files.map((file) => ({
            url: file.path,
            public_id: file.filename,
        }));
    }

    if (["published", "unavailable"].includes(property.listingStatus)) {
        property.listingStatus = "pendingReview";
        property.submittedForReviewAt = new Date();
        property.reviewedAt = null;
        property.reviewedBy = null;
        property.rejectionReason = null;
        property.publishedAt = null;
        property.unavailableAt = null;
        property.statusChangedAt = new Date();
    }

    const updatedProperty = await propertyRepository.save(property);

    if (oldImages.length) {
        await Promise.allSettled(
            oldImages.map((image) =>
                cloudinary.uploader.destroy(image.public_id)
            )
        );
    }

    return updatedProperty;
};

exports.submitPropertyForReview = async ({ propertyId, user }) => {
    validatePropertyId(propertyId);
    const property = await propertyRepository.findById(propertyId);
    ensureOwnedProperty(property, user);

    if (!["draft", "rejected"].includes(property.listingStatus)) {
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

exports.approveProperty = async ({ propertyId, admin }) => {
    validatePropertyId(propertyId);
    const property = await propertyRepository.findById(propertyId);

    if (!property) throw new ApiError(404, "Property not found");
    if (property.listingStatus !== "pendingReview") {
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
    return propertyRepository.findByIdWithDetails(propertyId);
};

exports.rejectProperty = async ({
    propertyId,
    admin,
    reason,
}) => {
    validatePropertyId(propertyId);
    const property = await propertyRepository.findById(propertyId);

    if (!property) throw new ApiError(404, "Property not found");
    if (property.listingStatus !== "pendingReview") {
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
    return propertyRepository.findByIdWithDetails(propertyId);
};

exports.archiveProperty = async ({ propertyId, user }) => {
    validatePropertyId(propertyId);
    const property = await propertyRepository.findById(propertyId);
    ensureOwnedProperty(property, user);

    if (property.listingStatus === "archived") {
        throw new ApiError(409, "Property is already archived");
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
    const property = await propertyRepository.findById(propertyId);
    ensureOwnedProperty(property, user);

    const currentStatus = property.listingStatus;
    const transitions =
        PROPERTY_STATUS_TRANSITIONS[property.listingType] || {};
    const allowedNextStatuses = transitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
        throw new ApiError(
            409,
            [
                `A ${property.listingType} listing`,
                `cannot move from ${currentStatus}`,
                `to ${status}.`,
                `Allowed next statuses: ${
                    allowedNextStatuses.join(", ") || "none"
                }.`,
            ].join(" ")
        );
    }

    const now = new Date();
    property.listingStatus = status;
    property.statusChangedAt = now;

    if (status === "unavailable") property.unavailableAt = now;
    if (status === "published") {
        property.unavailableAt = null;
        property.publishedAt = property.publishedAt || now;
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
    return propertyRepository.findByIdWithDetails(propertyId);
};

exports.relistProperty = async ({ propertyId, user }) => {
    validatePropertyId(propertyId);
    const property = await propertyRepository.findById(propertyId);
    ensureOwnedProperty(property, user);

    if (!["rented", "sold"].includes(property.listingStatus)) {
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
    property.listingStatus = "pendingReview";
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
    return propertyRepository.findByIdWithDetails(propertyId);
};
