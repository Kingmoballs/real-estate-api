const Property = require("../models/Property");

// Find property by ID
exports.findById = async (id, session) => {
    const query = Property.findById(id);
    if (session) query.session(session);
    return query;
};

