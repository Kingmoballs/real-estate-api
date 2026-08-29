const express = require("express");

const {
    createBooking,
    approveBooking,
    rejectBooking,
    uploadPaymentReceipt,
    verifyPaymentReceipt,
    rejectPaymentReceipt,
} = require("./booking.controller");

const {
    protect,
    authorizeRoles,
} = require("@/shared/middleware/authMiddleware");

const {
    createBookingSchema,
} = require("./booking.validator");

const validate =
    require("@/shared/middleware/validateMiddleware");

const uploadReceipt =
    require("@/shared/middleware/uploadReceipt");

const uploadError =
    require("@/shared/middleware/uploadErrorMiddleware");

const router = express.Router();

const agentOnly = authorizeRoles("agent");

const agentOrAdmin = authorizeRoles(
    "agent",
    "admin"
);

router.post(
    "/",
    protect,
    validate(createBookingSchema),
    createBooking
);

router.post(
    "/:bookingId/upload-receipt",
    protect,
    uploadReceipt.single("receipt"),
    uploadError,
    uploadPaymentReceipt
);

router.patch(
    "/:bookingId/approve",
    protect,
    agentOnly,
    approveBooking
);

router.patch(
    "/:bookingId/reject",
    protect,
    agentOnly,
    rejectBooking
);

router.patch(
    "/:bookingId/verify-receipt",
    protect,
    agentOrAdmin,
    verifyPaymentReceipt
);

router.patch(
    "/:bookingId/reject-receipt",
    protect,
    agentOrAdmin,
    rejectPaymentReceipt
);

module.exports = router;