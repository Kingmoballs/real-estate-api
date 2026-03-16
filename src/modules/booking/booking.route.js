const express = require("express");
const router = express.Router();
const { 
    createBooking, 
    approveBooking, 
    rejectBooking, 
    uploadPaymentReceipt,
    verifyPaymentReceipt,
    rejectPaymentReceipt
} = require("./booking.controller");
const upload = require("@/shared/middleware/uploadMiddleware");
const isAgent = require("@/shared/middleware/isAgentMiddleware")
const { protect } = require("@/shared/middleware/authMiddleware");
const { createBookingSchema } = require("./booking.validator");
const validate = require("@/shared/middleware/validateMiddleware");
const uploadError = require("@/shared/middleware/uploadErrorMiddleware");


router.post(
    "/", 
    protect, 
    validate(createBookingSchema), 
    createBooking
);
router.post(
    "/:bookingId/upload-receipt",
    protect,
    //upload.single("receipt"),
    uploadError,
    uploadPaymentReceipt
);
router.patch("/:bookingId/approve", protect, isAgent, approveBooking);
router.patch("/:bookingId/reject", protect, isAgent, rejectBooking);
router.patch("/:bookingId/verify-receipt", protect, isAgent, verifyPaymentReceipt);
router.patch("/:bookingId/reject-receipt", protect, isAgent, rejectPaymentReceipt);

module.exports = router