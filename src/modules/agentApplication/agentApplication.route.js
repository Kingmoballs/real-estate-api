const express = require("express");

const {
    submitApplication,
    getMyApplication,
    listApplications,
    getApplicationById,
    approveApplication,
    rejectApplication,
} = require("./agentApplication.controller");

const {
    protect,
    authorizeRoles,
} = require("@/shared/middleware/authMiddleware");

const validate = require(
    "@/shared/middleware/validateMiddleware"
);

const validateQuery = require(
    "@/shared/middleware/validateQueryMiddleware"
);

const {
    submitAgentApplicationSchema,
    listAgentApplicationsQuerySchema,
    rejectAgentApplicationSchema,
} = require("./agentApplication.validator");

const router = express.Router();

const userOnly = authorizeRoles("user");
const adminOnly = authorizeRoles("admin");

/*
 * Admin routes
 */

router.get(
    "/admin",
    protect,
    adminOnly,
    validateQuery(
        listAgentApplicationsQuerySchema
    ),
    listApplications
);

router.get(
    "/admin/:applicationId",
    protect,
    adminOnly,
    getApplicationById
);

router.patch(
    "/admin/:applicationId/approve",
    protect,
    adminOnly,
    approveApplication
);

router.patch(
    "/admin/:applicationId/reject",
    protect,
    adminOnly,
    validate(rejectAgentApplicationSchema),
    rejectApplication
);

/*
 * Applicant routes
 */

router.post(
    "/",
    protect,
    userOnly,
    validate(submitAgentApplicationSchema),
    submitApplication
);

router.get(
    "/me",
    protect,
    getMyApplication
);

module.exports = router;