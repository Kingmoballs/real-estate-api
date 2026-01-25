const Property = require("../models/Property");

// Find property by ID
exports.findById = async (id, session) => {
    const query = Property.findById(id);
    if (session) query.session(session);
    return query;
};

// Create new property
exports.create = async (propertyData, session = null) => {
    const property = new Property(propertyData);
    return session ? property.save({ session }) : property.save();
};

// Find all properties with optional filters
exports.findAll = async (filters = {}) => {
    return Property.find(filters).sort({ createdAt: -1 });
};

// Delete property by ID
exports.deleteById = async (id, session = null) => {
    const query = Property.findByIdAndDelete(id);
    if (session) query.session(session);
    return query;
};

// Count properties by agent
exports.countByAgent = async (agentId) => {
    return Property.countDocuments({ postedBy: agentId });
};

// Find properties by agent with selected fields
exports.findByAgent = async (agentId, fields = []) => {
    return Property.find({ postedBy: agentId }).select(fields.join(" "));
};
