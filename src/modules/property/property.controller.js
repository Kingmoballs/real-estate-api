const propertyService = require(
    "./property.service"
);

exports.createProperty = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService.createProperty({
                user: req.user,
                body: req.body,
                files: req.files,
            });

        res.status(201).json({
            message:
                property.listingStatus === "draft"
                    ? "Property draft created successfully"
                    : "Property submitted for review successfully",
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.getPublicProperties = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await propertyService
                .getPublicProperties(req.query);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getPublicPropertyById = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService
                .getPublicPropertyById(
                    req.params.id
                );

        res.status(200).json({
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.getAgentProperties = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await propertyService
                .getAgentProperties({
                    user: req.user,
                    query: req.query,
                });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAgentPropertyById = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService
                .getAgentPropertyById({
                    propertyId: req.params.id,
                    user: req.user,
                });

        res.status(200).json({
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdminProperties = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await propertyService
                .getAdminProperties(req.query);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAdminPropertyById = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService
                .getAdminPropertyById(
                    req.params.id
                );

        res.status(200).json({
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProperty = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService.updateProperty({
                propertyId: req.params.id,
                user: req.user,
                body: req.body,
                files: req.files,
            });

        res.status(200).json({
            message:
                "Property updated successfully",
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.submitPropertyForReview = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService
                .submitPropertyForReview({
                    propertyId: req.params.id,
                    user: req.user,
                });

        res.status(200).json({
            message:
                "Property submitted for review successfully",
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.approveProperty = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService.approveProperty({
                propertyId: req.params.id,
                admin: req.user,
            });

        res.status(200).json({
            message:
                "Property published successfully",
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.rejectProperty = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService.rejectProperty({
                propertyId: req.params.id,
                admin: req.user,
                reason: req.body.reason,
            });

        res.status(200).json({
            message:
                "Property rejected successfully",
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.archiveProperty = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService.archiveProperty({
                propertyId: req.params.id,
                user: req.user,
            });

        res.status(200).json({
            message:
                "Property archived successfully",
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePropertyStatus = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService
                .updatePropertyStatus({
                    propertyId: req.params.id,
                    user: req.user,
                    status: req.body.status,
                });

        res.status(200).json({
            message:
                `Property status changed to ${property.listingStatus}`,
            property,
        });
    } catch (error) {
        next(error);
    }
};

exports.relistProperty = async (
    req,
    res,
    next
) => {
    try {
        const property =
            await propertyService.relistProperty({
                propertyId: req.params.id,
                user: req.user,
            });

        res.status(200).json({
            message:
                "Property submitted for relisting review",
            property,
        });
    } catch (error) {
        next(error);
    }
};