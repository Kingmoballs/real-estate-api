const reviewService = require("./review.service");

exports.checkEligibility = async (req, res, next) => {
    try {
        const data = await reviewService.checkEligibility({
            user: req.user,
            propertyId: req.params.propertyId,
        });
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

exports.createReview = async (req, res, next) => {
    try {
        const data = await reviewService.createReview({
            user: req.user,
            payload: req.body,
        });
        res.status(201).json({ message: "Review created successfully", ...data });
    } catch (error) {
        next(error);
    }
};

exports.getPublicPropertyReviews = async (req, res, next) => {
    try {
        const data = await reviewService.getPublicPropertyReviews({
            propertyId: req.params.propertyId,
            query: req.query,
        });
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

exports.getMyReviews = async (req, res, next) => {
    try {
        res.status(200).json(
            await reviewService.getMyReviews({ user: req.user, query: req.query })
        );
    } catch (error) {
        next(error);
    }
};

exports.getAgentReviews = async (req, res, next) => {
    try {
        res.status(200).json(
            await reviewService.getAgentReviews({ user: req.user, query: req.query })
        );
    } catch (error) {
        next(error);
    }
};

exports.getAdminReviews = async (req, res, next) => {
    try {
        res.status(200).json(
            await reviewService.getAdminReviews({ query: req.query })
        );
    } catch (error) {
        next(error);
    }
};

exports.updateReview = async (req, res, next) => {
    try {
        const data = await reviewService.updateReview({
            reviewId: req.params.reviewId,
            user: req.user,
            payload: req.body,
        });
        res.status(200).json({ message: "Review updated successfully", ...data });
    } catch (error) {
        next(error);
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const data = await reviewService.deleteReview({
            reviewId: req.params.reviewId,
            user: req.user,
        });
        res.status(200).json({ message: "Review deleted successfully", ...data });
    } catch (error) {
        next(error);
    }
};

exports.upsertAgentResponse = async (req, res, next) => {
    try {
        const review = await reviewService.upsertAgentResponse({
            reviewId: req.params.reviewId,
            user: req.user,
            comment: req.body.comment,
        });
        res.status(200).json({ message: "Response saved successfully", review });
    } catch (error) {
        next(error);
    }
};

exports.deleteAgentResponse = async (req, res, next) => {
    try {
        const review = await reviewService.deleteAgentResponse({
            reviewId: req.params.reviewId,
            user: req.user,
        });
        res.status(200).json({ message: "Response removed successfully", review });
    } catch (error) {
        next(error);
    }
};

exports.moderateReview = async (req, res, next) => {
    try {
        const data = await reviewService.moderateReview({
            reviewId: req.params.reviewId,
            admin: req.user,
            status: req.body.status,
            reason: req.body.reason,
        });
        res.status(200).json({ message: "Review moderation updated", ...data });
    } catch (error) {
        next(error);
    }
};
