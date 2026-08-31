const express = require("express");

const controller = require("./review.controller");
const {
    createReviewSchema,
    updateReviewSchema,
    agentResponseSchema,
    moderationSchema,
    publicReviewQuerySchema,
    reviewQuerySchema,
} = require("./review.validator");
const {
    protect,
    authorizeRoles,
} = require("@/shared/middleware/authMiddleware");
const validate = require("@/shared/middleware/validateMiddleware");
const validateQuery = require("@/shared/middleware/validateQueryMiddleware");

const router = express.Router();
const userOnly = authorizeRoles("user");
const agentOnly = authorizeRoles("agent");
const adminOnly = authorizeRoles("admin");

router.get(
    "/property/:propertyId",
    validateQuery(publicReviewQuerySchema),
    controller.getPublicPropertyReviews
);
router.get(
    "/eligibility/:propertyId",
    protect,
    userOnly,
    controller.checkEligibility
);
router.get(
    "/mine",
    protect,
    userOnly,
    validateQuery(reviewQuerySchema),
    controller.getMyReviews
);
router.get(
    "/agent",
    protect,
    agentOnly,
    validateQuery(reviewQuerySchema),
    controller.getAgentReviews
);
router.get(
    "/admin",
    protect,
    adminOnly,
    validateQuery(reviewQuerySchema),
    controller.getAdminReviews
);
router.post(
    "/",
    protect,
    userOnly,
    validate(createReviewSchema),
    controller.createReview
);
router.patch(
    "/:reviewId",
    protect,
    userOnly,
    validate(updateReviewSchema),
    controller.updateReview
);
router.delete("/:reviewId", protect, controller.deleteReview);
router.put(
    "/:reviewId/response",
    protect,
    agentOnly,
    validate(agentResponseSchema),
    controller.upsertAgentResponse
);
router.delete(
    "/:reviewId/response",
    protect,
    controller.deleteAgentResponse
);
router.patch(
    "/:reviewId/moderate",
    protect,
    adminOnly,
    validate(moderationSchema),
    controller.moderateReview
);

module.exports = router;
