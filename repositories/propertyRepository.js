const Property = require("../models/Property");

exports.findById = async (id) => {
    return Property.findById(id);
};
