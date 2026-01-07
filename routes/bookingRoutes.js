const express = require("express");
const router = express.Router();
const { 
    createBooking, 
    approveBooking, 
    rejectBooking, 
    uploadPaymentReceipt,
    verifyPaymentReceipt,
    rejectPaymentReceipt
} = require("../controllers/bookingController");
const upload = require("../middleware/uploadReceipt");
const isAgent = require("../middleware/isAgentMiddleware")
const { protect } = require("../middleware/authMiddleware");
const { createBookingSchema } = require("../validators/bookingValidator");
const validate = require("../middleware/validateMiddleware");
const uploadError = require("../middleware/uploadErrorMiddleware");


router.post(
    "/", 
    protect, 
    validate(createBookingSchema), 
    createBooking
);
router.post(
    "/:bookingId/upload-receipt",
    protect,
    upload.single("receipt"),
    uploadError,
    uploadPaymentReceipt
);
router.patch("/:bookingId/approve", protect, isAgent, approveBooking);
router.patch("/:bookingId/reject", protect, isAgent, rejectBooking);
router.patch("/:bookingId/verify-receipt", protect, isAgent, verifyPaymentReceipt);
router.patch("/:bookingId/reject-receipt", protect, isAgent, rejectPaymentReceipt);

module.exports = router