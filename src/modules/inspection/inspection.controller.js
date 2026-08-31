const inspectionService = require(
    "./inspection.service"
);

exports.createInspection = async (
    req,
    res,
    next
) => {
    try {
        const inspection =
            await inspectionService.createInspection({
                user: req.user,
                payload: req.body,
            });

        res.status(201).json({
            message:
                "Inspection requested successfully",
            inspection,
        });
    } catch (error) {
        next(error);
    }
};

exports.getInspectionById = async (
    req,
    res,
    next
) => {
    try {
        const inspection =
            await inspectionService.getInspectionById({
                inspectionId:
                    req.params.inspectionId,
                user: req.user,
            });

        res.status(200).json({
            inspection,
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyInspections = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await inspectionService.getMyInspections({
                user: req.user,
                query: req.query,
            });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAgentInspections = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await inspectionService.getAgentInspections({
                user: req.user,
                query: req.query,
            });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAdminInspections = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await inspectionService.getAdminInspections({
                query: req.query,
            });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.confirmInspection = async (
    req,
    res,
    next
) => {
    try {
        const inspection =
            await inspectionService.confirmInspection({
                inspectionId:
                    req.params.inspectionId,
                user: req.user,
            });

        res.status(200).json({
            message:
                "Inspection confirmed successfully",
            inspection,
        });
    } catch (error) {
        next(error);
    }
};

exports.proposeReschedule = async (
    req,
    res,
    next
) => {
    try {
        const inspection =
            await inspectionService.proposeReschedule({
                inspectionId:
                    req.params.inspectionId,
                user: req.user,
                payload: req.body,
            });

        res.status(200).json({
            message:
                "New inspection time proposed",
            inspection,
        });
    } catch (error) {
        next(error);
    }
};

exports.acceptReschedule = async (
    req,
    res,
    next
) => {
    try {
        const inspection =
            await inspectionService.acceptReschedule({
                inspectionId:
                    req.params.inspectionId,
                user: req.user,
            });

        res.status(200).json({
            message:
                "Rescheduled inspection accepted",
            inspection,
        });
    } catch (error) {
        next(error);
    }
};

exports.rejectInspection = async (
    req,
    res,
    next
) => {
    try {
        const inspection =
            await inspectionService.rejectInspection({
                inspectionId:
                    req.params.inspectionId,
                user: req.user,
                reason: req.body.reason,
            });

        res.status(200).json({
            message:
                "Inspection rejected successfully",
            inspection,
        });
    } catch (error) {
        next(error);
    }
};

exports.cancelInspection = async (
    req,
    res,
    next
) => {
    try {
        const inspection =
            await inspectionService.cancelInspection({
                inspectionId:
                    req.params.inspectionId,
                user: req.user,
                reason: req.body.reason,
            });

        res.status(200).json({
            message:
                "Inspection cancelled successfully",
            inspection,
        });
    } catch (error) {
        next(error);
    }
};

exports.completeInspection = async (
    req,
    res,
    next
) => {
    try {
        const inspection =
            await inspectionService.completeInspection({
                inspectionId:
                    req.params.inspectionId,
                user: req.user,
            });

        res.status(200).json({
            message:
                "Inspection completed successfully",
            inspection,
        });
    } catch (error) {
        next(error);
    }
};