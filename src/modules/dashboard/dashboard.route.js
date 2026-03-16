const express = require("express");
const router = express.Router();
const { getAgentDashboard } = require("./dashboard.controller");
const { protect } = require("@/shared/middleware/authMiddleware");

router.get("/agent", protect, getAgentDashboard);

module.exports = router 