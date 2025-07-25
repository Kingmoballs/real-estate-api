const express = require("express");
const router = express.Router();
const { createProperty, getAllProperties, getPropertyById, updateProperty, deleteProperty } = require("../controllers/propertyController");
const authenticateUser = require("../middleware/authMiddleware");

router.post("/", authenticateUser, createProperty);
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);
router.put("/:id", authenticateUser, updateProperty);
router.delete("/:id", authenticateUser, deleteProperty);

module.exports = router