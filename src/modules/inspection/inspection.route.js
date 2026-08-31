const express = require("express");

const {
    createInspection,
    getInspectionById,
    getMyInspections,
    getAgentInspections,
    getAdminInspections,
    confirmInspection,
    proposeReschedule,
    acceptReschedule,
    rejectInspection,
    cancelInspection,
    completeInspection,
} = require("./inspection.controller");

const {
    createInspectionSchema,
    rescheduleInspectionSchema,
    rejectInspectionSchema,
    cancelInspectionSchema,
    inspectionQuerySchema,
} = require("./inspection.validator");

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

const router = express.Router();

const userOnly = authorizeRoles("user");
const agentOrAdmin = authorizeRoles(
    "agent",
    "admin"
);
const agentOnly = authorizeRoles("agent");
const adminOnly = authorizeRoles("admin");

router.get(
    "/mine",
    protect,
    userOnly,
    validateQuery(inspectionQuerySchema),
    getMyInspections
);

router.get(
    "/agent",
    protect,
    agentOnly,
    validateQuery(inspectionQuerySchema),
    getAgentInspections
);

router.get(
    "/admin",
    protect,
    adminOnly,
    validateQuery(inspectionQuerySchema),
    getAdminInspections
);

router.post(
    "/",
    protect,
    userOnly,
    validate(createInspectionSchema),
    createInspection
);

router.get(
    "/:inspectionId",
    protect,
    getInspectionById
);

router.patch(
    "/:inspectionId/confirm",
    protect,
    agentOrAdmin,
    confirmInspection
);

router.patch(
    "/:inspectionId/reschedule",
    protect,
    agentOrAdmin,
    validate(rescheduleInspectionSchema),
    proposeReschedule
);

router.patch(
    "/:inspectionId/accept-reschedule",
    protect,
    userOnly,
    acceptReschedule
);

router.patch(
    "/:inspectionId/reject",
    protect,
    agentOrAdmin,
    validate(rejectInspectionSchema),
    rejectInspection
);

router.patch(
    "/:inspectionId/cancel",
    protect,
    validate(cancelInspectionSchema),
    cancelInspection
);

router.patch(
    "/:inspectionId/complete",
    protect,
    agentOrAdmin,
    completeInspection
);

module.exports = router;