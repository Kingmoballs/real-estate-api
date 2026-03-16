const express = require("express");
const router = express.Router();
const { createProperty, getAllProperties, getPropertyById, updateProperty, deleteProperty } = require("./property.controller");
const { protect, requireAgent } = require("@/shared/middleware/authMiddleware");
const { createPropertySchema, updatePropertySchema } = require("./property.validator");
const validate = require("@/shared/middleware/validateMiddleware");
const upload = require("@/shared/middleware/uploadPropertyMedia");
const uploadError = require("@/shared/middleware/uploadErrorMiddleware");

router.post(
    "/", 
    protect, 
    requireAgent, 
    upload.array("images", 10),
    uploadError,
    validate(createPropertySchema),
    createProperty
);
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);
router.put(
    "/:id", 
    protect, 
    requireAgent, 
    upload.array("images", 10), 
    uploadError,
    validate(updatePropertySchema),
    updateProperty
);
router.delete("/:id", protect, requireAgent, deleteProperty);

module.exports = router