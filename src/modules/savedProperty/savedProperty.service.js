const mongoose = require("mongoose");

const ApiError = require("@/shared/utils/ApiError");
const propertyRepository = require(
    "@/modules/property/property.repository"
);
const savedPropertyRepository = require(
    "./savedProperty.repository"
);

const validatePropertyId = (propertyId) => {
    if (!mongoose.isValidObjectId(propertyId)) {
        throw new ApiError(
            400,
            "Invalid property ID"
        );
    }
};

exports.saveProperty = async ({
    user,
    propertyId,
}) => {
    validatePropertyId(propertyId);

    // This also ensures that only published properties
    // can be saved.
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

    const savedProperty =
        await savedPropertyRepository.saveProperty({
            userId: user._id,
            propertyId,
        });

    return {
        savedProperty,
        property,
    };
};

exports.removeSavedProperty = async ({
    user,
    propertyId,
}) => {
    validatePropertyId(propertyId);

    const result =
        await savedPropertyRepository.removeProperty({
            userId: user._id,
            propertyId,
        });

    return {
        removed: result.deletedCount > 0,
    };
};

exports.getSavedProperties = async ({
    user,
    query,
}) => {
    return savedPropertyRepository.getSavedProperties({
        userId: user._id,
        page: query.page,
        limit: query.limit,
    });
};

exports.getSavedStatus = async ({
    user,
    propertyId,
}) => {
    validatePropertyId(propertyId);

    const saved =
        await savedPropertyRepository.isPropertySaved({
            userId: user._id,
            propertyId,
        });

    return {
        propertyId,
        isSaved: Boolean(saved),
    };
};