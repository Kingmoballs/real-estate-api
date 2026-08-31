const express = require("express");

const {
    saveProperty,
    removeSavedProperty,
    getSavedProperties,
    getSavedStatus,
} = require("./savedProperty.controller");

const {
    savedPropertyQuerySchema,
} = require("./savedProperty.validator");

const {
    protect,
} = require("@/shared/middleware/authMiddleware");

const validateQuery = require(
    "@/shared/middleware/validateQueryMiddleware"
);

const router = express.Router();

router.get(
    "/",
    protect,
    validateQuery(savedPropertyQuerySchema),
    getSavedProperties
);

router.get(
    "/:propertyId/status",
    protect,
    getSavedStatus
);

router.put(
    "/:propertyId",
    protect,
    saveProperty
);

router.delete(
    "/:propertyId",
    protect,
    removeSavedProperty
);

module.exports = router;