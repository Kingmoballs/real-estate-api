const mongoose = require("mongoose");
const SavedProperty = require("./savedProperty.model");

exports.saveProperty = ({ userId, propertyId }) => {
    return SavedProperty.findOneAndUpdate(
        {
            user: userId,
            property: propertyId,
        },
        {
            $setOnInsert: {
                user: userId,
                property: propertyId,
            },
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );
};

exports.removeProperty = ({ userId, propertyId }) => {
    return SavedProperty.deleteOne({
        user: userId,
        property: propertyId,
    });
};

exports.isPropertySaved = ({ userId, propertyId }) => {
    return SavedProperty.exists({
        user: userId,
        property: propertyId,
    });
};

exports.getSavedProperties = async ({
    userId,
    page,
    limit,
}) => {
    const skip = (page - 1) * limit;

    const [result] = await SavedProperty.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "properties",
                localField: "property",
                foreignField: "_id",
                as: "property",
            },
        },
        {
            $unwind: "$property",
        },
        {
            $match: {
                "property.listingStatus": "published",
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $facet: {
                savedProperties: [
                    {
                        $skip: skip,
                    },
                    {
                        $limit: limit,
                    },
                    {
                        $project: {
                            user: 0,
                            updatedAt: 0,
                            __v: 0,

                            // Do not return property moderation details
                            "property.reviewedBy": 0,
                            "property.rejectionReason": 0,
                        },
                    },
                ],
                count: [
                    {
                        $count: "total",
                    },
                ],
            },
        },
    ]);

    const savedProperties =
        result?.savedProperties || [];

    const totalItems =
        result?.count?.[0]?.total || 0;

    const totalPages = Math.ceil(totalItems / limit);

    return {
        savedProperties,
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