const mongoose = require("mongoose");

const ApiError = require("@/shared/utils/ApiError");
const propertyRepository = require("@/modules/property/property.repository");
const bookingRepository = require("@/modules/booking/booking.repository");
const inspectionRepository = require("@/modules/inspection/inspection.repository");
const reviewRepository = require("./review.repository");
const eventBus = require("@/shared/events/eventBus");
const EVENTS = require("@/shared/events/eventRegistry");

const PUBLIC_SORTS = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 },
};

const sameId = (first, second) =>
    String(first?._id || first) === String(second?._id || second);

const validateObjectId = (value, label) => {
    if (!mongoose.isValidObjectId(value)) {
        throw new ApiError(400, `Invalid ${label}`);
    }
};

const refreshPropertyRating = async (propertyId) => {
    const summary = await reviewRepository.getPublishedRatingSummary(
        new mongoose.Types.ObjectId(propertyId)
    );

    await propertyRepository.updateRatingSummary(propertyId, summary);
    return summary;
};

const getEligibility = async ({ property, customerId }) => {
    if (property.listingType === "shortlet") {
        const booking = await bookingRepository.findCompletedByGuestAndProperty({
            guestId: customerId,
            propertyId: property._id,
        });

        return booking
            ? {
                  eligible: true,
                  verificationSource: "booking",
                  booking: booking._id,
                  inspection: null,
              }
            : {
                  eligible: false,
                  reason: "A completed booking is required to review this shortlet",
              };
    }

    const inspection =
        await inspectionRepository.findCompletedByCustomerAndProperty({
            customerId,
            propertyId: property._id,
        });

    return inspection
        ? {
              eligible: true,
              verificationSource: "inspection",
              booking: null,
              inspection: inspection._id,
          }
        : {
              eligible: false,
              reason: "A completed inspection is required to review this property",
          };
};

const getReviewOrThrow = async (reviewId) => {
    validateObjectId(reviewId, "review ID");
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new ApiError(404, "Review not found");
    return review;
};

const buildFilters = (query) => {
    const filters = {};
    if (query.status) filters.status = query.status;
    if (query.rating) filters.rating = query.rating;
    if (query.property) {
        validateObjectId(query.property, "property ID");
        filters.property = query.property;
    }
    return filters;
};

exports.checkEligibility = async ({ user, propertyId }) => {
    validateObjectId(propertyId, "property ID");

    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    const existing = await reviewRepository.findByCustomerAndProperty({
        customerId: user._id,
        propertyId,
    });

    if (existing) {
        return {
            eligible: false,
            alreadyReviewed: true,
            reviewId: existing._id,
            reason: "You have already reviewed this property",
        };
    }

    return getEligibility({ property, customerId: user._id });
};

exports.createReview = async ({ user, payload }) => {
    validateObjectId(payload.property, "property ID");

    const property = await propertyRepository.findById(payload.property);
    if (!property) throw new ApiError(404, "Property not found");

    if (sameId(property.postedBy, user._id)) {
        throw new ApiError(400, "You cannot review your own property");
    }

    const existing = await reviewRepository.findByCustomerAndProperty({
        customerId: user._id,
        propertyId: property._id,
    });
    if (existing) {
        throw new ApiError(409, "You have already reviewed this property");
    }

    const eligibility = await getEligibility({
        property,
        customerId: user._id,
    });
    if (!eligibility.eligible) {
        throw new ApiError(403, eligibility.reason);
    }

    let review;
    try {
        review = await reviewRepository.create({
            property: property._id,
            customer: user._id,
            propertyAgent: property.postedBy,
            rating: payload.rating,
            title: payload.title,
            comment: payload.comment,
            verificationSource: eligibility.verificationSource,
            booking: eligibility.booking,
            inspection: eligibility.inspection,
        });
    } catch (error) {
        if (error?.code === 11000) {
            throw new ApiError(409, "You have already reviewed this property");
        }
        throw error;
    }

    const ratingSummary = await refreshPropertyRating(property._id);
    const detailedReview = await reviewRepository.findByIdWithDetails(review._id);

    eventBus.emit(EVENTS.REVIEW_CREATED, {
        reviewId: review._id,
        recipientId: property.postedBy,
        title: "New Property Review",
        body: `${user.name} left a ${review.rating}-star review for \"${property.title}\".`,
    });

    return { review: detailedReview, ratingSummary };
};

exports.getPublicPropertyReviews = async ({ propertyId, query }) => {
    validateObjectId(propertyId, "property ID");
    const property = await propertyRepository.findPublicById(propertyId);
    if (!property) throw new ApiError(404, "Published property not found");

    const filters = { property: propertyId, status: "published" };
    if (query.rating) filters.rating = query.rating;

    const result = await reviewRepository.findPublicPaginated({
        filters,
        page: query.page,
        limit: query.limit,
        sort: PUBLIC_SORTS[query.sort] || PUBLIC_SORTS.newest,
    });

    return {
        property: {
            id: property._id,
            title: property.title,
            ratingAverage: property.ratingAverage,
            reviewCount: property.reviewCount,
        },
        ...result,
    };
};

exports.getMyReviews = ({ user, query }) =>
    reviewRepository.findPaginated({
        filters: { ...buildFilters(query), customer: user._id },
        page: query.page,
        limit: query.limit,
    });

exports.getAgentReviews = ({ user, query }) =>
    reviewRepository.findPaginated({
        filters: { ...buildFilters(query), propertyAgent: user._id },
        page: query.page,
        limit: query.limit,
    });

exports.getAdminReviews = ({ query }) =>
    reviewRepository.findPaginated({
        filters: buildFilters(query),
        page: query.page,
        limit: query.limit,
    });

exports.updateReview = async ({ reviewId, user, payload }) => {
    const review = await getReviewOrThrow(reviewId);
    if (!sameId(review.customer, user._id)) {
        throw new ApiError(403, "You can only update your own review");
    }

    if (payload.rating !== undefined) review.rating = payload.rating;
    if (payload.title !== undefined) review.title = payload.title;
    if (payload.comment !== undefined) review.comment = payload.comment;

    await reviewRepository.save(review);
    const ratingSummary = await refreshPropertyRating(review.property);

    return {
        review: await reviewRepository.findByIdWithDetails(review._id),
        ratingSummary,
    };
};

exports.deleteReview = async ({ reviewId, user }) => {
    const review = await getReviewOrThrow(reviewId);
    if (!sameId(review.customer, user._id) && user.role !== "admin") {
        throw new ApiError(403, "You cannot delete this review");
    }

    const propertyId = review.property;
    await reviewRepository.deleteById(review._id);
    const ratingSummary = await refreshPropertyRating(propertyId);

    return { deleted: true, ratingSummary };
};

exports.upsertAgentResponse = async ({ reviewId, user, comment }) => {
    const review = await getReviewOrThrow(reviewId);
    if (!sameId(review.propertyAgent, user._id)) {
        throw new ApiError(403, "Only the listing agent can respond to this review");
    }

    review.agentResponse = {
        comment,
        respondedBy: user._id,
        respondedAt: new Date(),
    };
    await reviewRepository.save(review);

    eventBus.emit(EVENTS.REVIEW_RESPONDED, {
        reviewId: review._id,
        recipientId: review.customer,
        title: "Agent Responded to Your Review",
        body: `${user.name} responded to your property review.`,
    });

    return reviewRepository.findByIdWithDetails(review._id);
};

exports.deleteAgentResponse = async ({ reviewId, user }) => {
    const review = await getReviewOrThrow(reviewId);
    if (!sameId(review.propertyAgent, user._id) && user.role !== "admin") {
        throw new ApiError(403, "You cannot remove this response");
    }

    review.agentResponse = null;
    await reviewRepository.save(review);
    return reviewRepository.findByIdWithDetails(review._id);
};

exports.moderateReview = async ({ reviewId, admin, status, reason }) => {
    const review = await getReviewOrThrow(reviewId);
    const statusChanged = review.status !== status;

    review.status = status;
    review.moderationReason = status === "hidden" ? reason : null;
    review.moderatedBy = admin._id;
    review.moderatedAt = new Date();

    await reviewRepository.save(review);
    const ratingSummary = statusChanged
        ? await refreshPropertyRating(review.property)
        : await reviewRepository.getPublishedRatingSummary(review.property);

    if (statusChanged && status === "hidden") {
        eventBus.emit(EVENTS.REVIEW_MODERATED, {
            reviewId: review._id,
            recipientId: review.customer,
            title: "Review Hidden",
            body: `Your review was hidden by moderation. Reason: ${reason}`,
        });
    }

    return {
        review: await reviewRepository.findByIdWithDetails(review._id),
        ratingSummary,
    };
};
