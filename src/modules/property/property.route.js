const express = require("express");

const {
    createProperty,
    getPublicProperties,
    getPublicPropertyById,
    getAgentProperties,
    getAgentPropertyById,
    getAdminProperties,
    getAdminPropertyById,
    updateProperty,
    submitPropertyForReview,
    approveProperty,
    rejectProperty,
    archiveProperty,
} = require("./property.controller");

const {
    protect,
    authorizeRoles,
} = require("@/shared/middleware/authMiddleware");

const {
    createPropertySchema,
    updatePropertySchema,
    publicPropertyQuerySchema,
    ownedPropertyQuerySchema,
    adminPropertyQuerySchema,
    rejectPropertySchema,
} = require("./property.validator");

const validate = require(
    "@/shared/middleware/validateMiddleware"
);

const validateQuery = require(
    "@/shared/middleware/validateQueryMiddleware"
);

const upload = require(
    "@/shared/middleware/uploadPropertyMedia"
);

const uploadError = require(
    "@/shared/middleware/uploadErrorMiddleware"
);

const router = express.Router();

const agentOnly = authorizeRoles("agent");
const adminOnly = authorizeRoles("admin");

/*
 * Admin property-review routes
 */

router.get(
    "/admin",
    protect,
    adminOnly,
    validateQuery(adminPropertyQuerySchema),
    getAdminProperties
);

router.get(
    "/admin/:id",
    protect,
    adminOnly,
    getAdminPropertyById
);

router.patch(
    "/admin/:id/approve",
    protect,
    adminOnly,
    approveProperty
);

router.patch(
    "/admin/:id/reject",
    protect,
    adminOnly,
    validate(rejectPropertySchema),
    rejectProperty
);

/*
 * Agent-owned property routes
 */

router.get(
    "/mine",
    protect,
    agentOnly,
    validateQuery(ownedPropertyQuerySchema),
    getAgentProperties
);

router.get(
    "/mine/:id",
    protect,
    agentOnly,
    getAgentPropertyById
);

router.post(
    "/",
    protect,
    agentOnly,
    upload.array("images", 10),
    uploadError,
    validate(createPropertySchema),
    createProperty
);

router.put(
    "/:id",
    protect,
    agentOnly,
    upload.array("images", 10),
    uploadError,
    validate(updatePropertySchema),
    updateProperty
);

router.patch(
    "/:id/submit-for-review",
    protect,
    agentOnly,
    submitPropertyForReview
);

router.delete(
    "/:id",
    protect,
    agentOnly,
    archiveProperty
);

/*
 * Public property routes
 */

router.get(
    "/",
    validateQuery(publicPropertyQuerySchema),
    getPublicProperties
);

router.get(
    "/:id",
    getPublicPropertyById
);

module.exports = router;