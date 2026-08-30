const express = require("express");
const router = express.Router();
const { getAgentDashboard } = require("./dashboard.controller");
const {
    protect,
    authorizeRoles,
} = require("@/shared/middleware/authMiddleware");

router.get(
    "/agent",
    protect,
    authorizeRoles("agent"),
    getAgentDashboard
);

module.exports = router
