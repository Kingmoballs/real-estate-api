const propertyService = require("../services/propertyService");

// Create a new property
exports.createProperty = async (req, res, next) => {
    try {
        const property = await propertyService.createProperty({
            user: req.user,
            body: req.body,
            files: req.files,
        });

        res.status(201).json(property);
    } catch (err) {
        next(err);
    }
};

// Get all properties with optional filters
exports.getAllProperties = async (req, res, next) => {
    try {
        const properties = await propertyService.getAllProperties(req.query);
        res.status(200).json(properties);
    } catch (err) {
        next(err);
    }
};

// Get property by ID
exports.getPropertyById = async (req, res, next) => {
    try {
        const property = await propertyService.getPropertyById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        res.status(200).json(property);
    } catch (err) {
        next(err);
    }
};

// Update property
exports.updateProperty = async (req, res, next) => {
    try {
        const updatedProperty = await propertyService.updateProperty({
            propertyId: req.params.id,
            user: req.user,
            body: req.body,
            files: req.files,
        });

        res.status(200).json(updatedProperty);
    } catch (err) {
        next(err);
    }
};

// Delete property
exports.deleteProperty = async (req, res, next) => {
    try {
        await propertyService.deleteProperty({
            propertyId: req.params.id,
            user: req.user,
        });

        res.status(200).json({ message: "Property deleted successfully" });
    } catch (err) {
        next(err);
    }
};