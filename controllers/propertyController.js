const Property = require("../models/Property");

//@desc Create new property
//@route POST /api/properties
exports.createProperty = async (req, res) => {
    try{
        const newProperty = new Property(req.body);
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
        const properties = await Property.find();
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
        const property = await Property.findById(req.params.id);
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
        const updated = await  Property.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        res.status(200).json(updated)
    }
    catch (err) {
        res.status(404).json({ message: err.message })
    }
};

//@desc Delete a property
//@route DELETE /api/properties/:id
exports.deleteProperty = async (req, res) => {
    try{
        await Property.findByIdAndDelete(req.params.id) 
        res.status(204).end()
        
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}