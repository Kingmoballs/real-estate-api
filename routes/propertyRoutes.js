const express = require("express");
const router = express.Router();
const { createProperty, getAllProperties, getPropertyById, updateProperty, deleteProperty } = require("../controllers/propertyController");
const { protect, requireAgent } = require("../middleware/authMiddleware");
const { createPropertySchema, updatePropertySchema } = require("../validators/propertyValidator");
const validate = require("../middleware/validateMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const uploadError = require("../middleware/uploadErrorMiddleware");

router.post(
    "/", 
    protect, 
    requireAgent, 
    validate(createPropertySchema),
    upload.array("images", 10),
    uploadError,
    createProperty
);
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);
router.put(
    "/:id", 
    protect, 
    requireAgent, 
    validate(updatePropertySchema),
    upload.array("images", 10), 
    uploadError,
    updateProperty
);
router.delete("/:id", protect, requireAgent, deleteProperty);

module.exports = router