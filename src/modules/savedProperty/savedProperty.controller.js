const savedPropertyService = require(
    "./savedProperty.service"
);

exports.saveProperty = async (req, res, next) => {
    try {
        const result =
            await savedPropertyService.saveProperty({
                user: req.user,
                propertyId: req.params.propertyId,
            });

        res.status(200).json({
            message: "Property saved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

exports.removeSavedProperty = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await savedPropertyService.removeSavedProperty(
                {
                    user: req.user,
                    propertyId:
                        req.params.propertyId,
                }
            );

        res.status(200).json({
            message: result.removed
                ? "Property removed from saved properties"
                : "Property was not in saved properties",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

exports.getSavedProperties = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await savedPropertyService.getSavedProperties({
                user: req.user,
                query: req.query,
            });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getSavedStatus = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await savedPropertyService.getSavedStatus({
                user: req.user,
                propertyId: req.params.propertyId,
            });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};