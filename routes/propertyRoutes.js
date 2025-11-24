const express = require("express");
const router = express.Router();
const { createProperty, getAllProperties, getPropertyById, updateProperty, deleteProperty } = require("../controllers/propertyController");
const { protect, requireAgent } = require("../middleware/authMiddleware");
const { createPropertySchema, updatePropertySchema } = require("../validators/propertyValidator");
const validate = require("../middleware/validateMiddleware")

router.post("/", protect, requireAgent, validate(createPropertySchema), createProperty);
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);
router.put("/:id", protect, requireAgent, validate(updatePropertySchema), updateProperty);
router.delete("/:id", protect, requireAgent, deleteProperty);

module.exports = router