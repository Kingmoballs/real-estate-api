const express = require("express");
const router = express.Router();
const { createBooking } = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const { createBookingSchema } = require("../validators/bookingValidator");
const validate = require("../middleware/validateMiddleware")


router.post("/", protect, validate(createBookingSchema), createBooking)

module.exports = router