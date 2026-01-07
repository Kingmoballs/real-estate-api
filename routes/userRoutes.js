const express = require("express");
const { getUserStatus } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:userId/status", protect, getUserStatus);

module.exports = router;