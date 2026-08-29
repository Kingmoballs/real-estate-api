const agentApplicationService = require(
    "./agentApplication.service"
);

exports.submitApplication = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await agentApplicationService.submitApplication({
                user: req.user,
                payload: req.body,
            });

        const statusCode = result.created ? 201 : 200;

        res.status(statusCode).json({
            message: result.created
                ? "Agent application submitted successfully"
                : "Agent application resubmitted successfully",
            application: result.application,
        });
    } catch (error) {
        next(error);
    }
};

exports.listApplications = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await agentApplicationService
                .listApplications(req.query);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getApplicationById = async (
    req,
    res,
    next
) => {
    try {
        const application =
            await agentApplicationService
                .getApplicationById(
                    req.params.applicationId
                );

        res.status(200).json({
            application,
        });
    } catch (error) {
        next(error);
    }
};

exports.approveApplication = async (
    req,
    res,
    next
) => {
    try {
        const application =
            await agentApplicationService
                .approveApplication({
                    applicationId:
                        req.params.applicationId,
                    admin: req.user,
                });

        res.status(200).json({
            message:
                "Agent application approved successfully",
            application,
        });
    } catch (error) {
        next(error);
    }
};

exports.rejectApplication = async (
    req,
    res,
    next
) => {
    try {
        const application =
            await agentApplicationService
                .rejectApplication({
                    applicationId:
                        req.params.applicationId,
                    admin: req.user,
                    reason: req.body.reason,
                });

        res.status(200).json({
            message:
                "Agent application rejected successfully",
            application,
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyApplication = async (
    req,
    res,
    next
) => {
    try {
        const application =
            await agentApplicationService.getMyApplication(
                req.user._id
            );

        res.status(200).json({
            application,
        });
    } catch (error) {
        next(error);
    }
};