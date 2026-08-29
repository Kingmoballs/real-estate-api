const propertyRepository = require("./property.repository");
const { cloudinary } = require("@/shared/middleware/uploadFactory");
const ApiError = require("@/shared/utils/ApiError");

// Create a new property
exports.createProperty = async ({ user, body, files }) => {
    if (!files || files.length === 0) {
        throw new ApiError(400, "At least one image is required");
    }

    const images = files.map(file => ({
        url: file.path,
        public_id: file.filename,
    }));

    const propertyData = {
        ...body,
        images,
        postedBy: user.id,
        agentName: user.name,
        agentEmail: user.email,
        agentPhone: user.phone,
    };

    return propertyRepository.create(propertyData);
};

// Get all properties with optional filters
exports.getAllProperties = async (query) => {
    const {
        listingType,
        type,
        propertyType,
        pricePeriod,
        currency,
        location,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
    } = query;

    const filters = {};

    if (location) {
        filters.location = {
            $regex: location,
            $options: "i",
        };
    }

    // "type" is temporarily supported for older clients.
    const requestedListingType = listingType || type;

    if (requestedListingType) {
        filters.listingType =
            requestedListingType === "serviced"
                ? "shortlet"
                : requestedListingType;
    }

    if (propertyType) {
        filters.propertyType = propertyType;
    }

    if (pricePeriod) {
        filters.pricePeriod = pricePeriod;
    }

    if (currency) {
        filters.currency = currency.toUpperCase();
    }

    if (minPrice || maxPrice) {
        filters.price = {};

        if (minPrice) {
            filters.price.$gte = Number(minPrice);
        }

        if (maxPrice) {
            filters.price.$lte = Number(maxPrice);
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

    return propertyRepository.findAll(filters);
};

exports.getPropertyById = async (propertyId, session = null) => {
    return propertyRepository.findById(propertyId, session)
        .populate("postedBy", "name phone");
};

exports.updateProperty = async ({ propertyId, user, body, files }) => {
    const property = await propertyRepository.findById(propertyId);

    if (!property) throw new ApiError(400, "Property not found");
    if (property.postedBy.toString() !== user.id) throw new ApiError(403, "Not authorized");

    // Handle images
    if (files && files.length > 0) {
        // Delete old images
        for (const img of property.images) {
            await cloudinary.uploader.destroy(img.public_id);
        }

        // Add new images
        property.images = files.map(file => ({
            url: file.path,
            public_id: file.filename
        }));
    }

    // Update editable fields
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

    editableFields.forEach(field => {
        if (body[field] !== undefined) {
            property[field] = body[field];
        }
    });

    return property.save();
};

exports.deleteProperty = async ({ propertyId, user }) => {
    const property = await propertyRepository.findById(propertyId);

    if (!property) throw new ApiError(400, "Property not found");
    if (property.postedBy.toString() !== user.id) throw new ApiError(401,"Not authorized");

    // Delete all images from Cloudinary
    for (const image of property.images) {
        await cloudinary.uploader.destroy(image.public_id);
    }

    // Delete property from DB
    await propertyRepository.deleteById(propertyId);
};