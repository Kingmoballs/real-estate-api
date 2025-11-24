const express = require("express");
const router = express.Router();
const { getAgentDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

router.get("/agent", protect, getAgentDashboard);

module.exports = router 