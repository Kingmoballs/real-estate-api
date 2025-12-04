const Property = require("../models/Property");
const { cloudinary } = require("../middleware/uploadMiddleware")

//@desc Create new property
//@route POST /api/properties
exports.createProperty = async (req, res) => {
    try{
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least a image is required" });
        }

        const images = req.files.map(file => ({
            url: file.path,
            public_id: file.filename
        }));

        const propertyData = {
            ...req.body,
            images,
            postedBy: req.user.id,
            agentName: req.user.name,
            agentEmail: req.user.email,
            agentPhone: req.user.phone
        };
        const newProperty = new Property(propertyData);
        const saved = await newProperty.save();
        res.status(201).json(saved);
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
};

//@desc Get all properties
//@route GET /api/properties
exports.getAllProperties = async (req, res) => {
    try{
        const { location, type, minPrice, maxPrice, bedrooms, bathrooms } = req.query

        let filters = {};

        if (location) {
            filters.location = { $regex: location, $options: "i" }
        }

        if (type) {
            filters.properyType = type
        }

        if (minPrice || maxPrice) {
            filters.price = {}
            if (minPrice) filters.price.$gte = Number(minPrice);
            if (maxPrice) filters.price.$lte = Number(maxPrice)
        }
        
        if (bedrooms) {
            filters.bedrooms = { $gte: Number(bedrooms) }
        }

        if (bathrooms) {
            filters.bathrooms = { $lte: Number(bathrooms) }
        }

        const properties = await Property.find(filters).sort({ createdAt: -1 });
        res.status(200).json(properties)
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
};

//@desc Get a single property by id
//@route GET /api/properties/:id
exports.getPropertyById = async (req, res) => {
    try{
        const property = await Property.findById(req.params.id).populate("postedBy", "name phone");
        if (!property)  return res.status(404).json({ message: "Not Found" });
        res.status(200).json(property)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
};

//@desc Update a property
//@route PUT /api/properties/:id
exports.updateProperty = async (req, res) => {
    try{
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Check if the logged-in user is the owner
        if (property.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this property" });
        }

        // Delete old images if provided
        const { imageToDelete } = req.body;
        if (imageToDelete && Array.isArray(imageToDelete)) {
            for (let publicId of imageToDelete) {
                await cloudinary.uploader.destroy(publicId);
                // Remove from property.images array
                property.images = property.images.filter(img => img.public_id !== publicId);
            }
        }

        // Add new images if uploaded
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                property.images.push({
                    url: file.path,
                    public_id: file.filename
                });
            });
        }

        // Update other fields
        const editableFields = [
            "title", "description", "price", "location",
            "bedrooms", "bathrooms", "propertyType", "dailyRate"
        ];

        editableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                property[field] = req.body[field];
            }
        });


        const updated = await  Property.save()
        res.status(200).json(updated)
    }
    catch (err) {
        console.error("update Property error", err)
        res.status(500).json({ message: err.message });
    }
};

//@desc Delete a property
//@route DELETE /api/properties/:id
exports.deleteProperty = async (req, res) => {
    try{
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Check if the logged-in user is the owner
        if (property.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this property" });
        }

        // 1️⃣ DELETE ALL IMAGES FROM CLOUDINARY
        for (const image of property.images) {
            await cloudinary.uploader.destroy(image.public_id);
        }

        await Property.findByIdAndDelete(req.params.id) 
        res.status(200).json({ message: "Property deleted successfully" })
        
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}