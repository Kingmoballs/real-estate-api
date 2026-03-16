const express = require("express");
const { getUserStatus } = require("./user.controller");
const { protect } = require("@/shared/middleware/authMiddleware");

const router = express.Router();

router.get("/:userId/status", protect, getUserStatus);

module.exports = router;