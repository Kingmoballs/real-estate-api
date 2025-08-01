const express = require("express");
const router = express.Router();
const { createBooking } = require("../controllers/bookingController");
const authenticateUser = require("../middleware/authMiddleware");


router.post("/", authenticateUser, createBooking)

module.exports = router