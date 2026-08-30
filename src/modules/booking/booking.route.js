const express = require("express");
const {
    checkAvailability,
    getAvailabilityCalendar,
    getMyBookings,
    getAgentBookings,
    getAdminBookings,
    getBookingById,
    createBooking,
    approveBooking,
    rejectBooking,
    cancelBooking,
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
    availabilityQuerySchema,
    availabilityCalendarQuerySchema,
    bookingQuerySchema,
    rejectBookingSchema,
    cancelBookingSchema,
    rejectReceiptSchema,
} = require("./booking.validator");
const validate = require("@/shared/middleware/validateMiddleware");
const validateQuery = require("@/shared/middleware/validateQueryMiddleware");
const uploadReceipt = require("@/shared/middleware/uploadReceipt");
const uploadError = require("@/shared/middleware/uploadErrorMiddleware");

const router = express.Router();
const agentOnly = authorizeRoles("agent");
const adminOnly = authorizeRoles("admin");
const agentOrAdmin = authorizeRoles("agent", "admin");

// Public shortlet availability endpoints.
router.get(
    "/availability/:propertyId/calendar",
    validateQuery(availabilityCalendarQuerySchema),
    getAvailabilityCalendar
);

router.get(
    "/availability/:propertyId",
    validateQuery(availabilityQuerySchema),
    checkAvailability
);

// Role-scoped booking lists. These routes must remain above /:bookingId.
router.get(
    "/mine",
    protect,
    validateQuery(bookingQuerySchema),
    getMyBookings
);

router.get(
    "/agent",
    protect,
    agentOnly,
    validateQuery(bookingQuerySchema),
    getAgentBookings
);

router.get(
    "/admin",
    protect,
    adminOnly,
    validateQuery(bookingQuerySchema),
    getAdminBookings
);

router.post(
    "/",
    protect,
    validate(createBookingSchema),
    createBooking
);

router.get(
    "/:bookingId",
    protect,
    getBookingById
);

router.patch(
    "/:bookingId/cancel",
    protect,
    validate(cancelBookingSchema),
    cancelBooking
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
    validate(rejectBookingSchema),
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
    validate(rejectReceiptSchema),
    rejectPaymentReceipt
);

module.exports = router;
