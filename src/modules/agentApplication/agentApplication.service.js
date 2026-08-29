const mongoose = require("mongoose");
const ApiError = require("@/shared/utils/ApiError");

const userRepository = require(
    "@/modules/user/user.repository"
);

const agentApplicationRepository = require(
    "./agentApplication.repository"
);

const normalizeApplicationPayload = (payload) => {
    const normalizedServiceAreas = [
        ...new Map(
            payload.serviceAreas.map((area) => {
                const trimmedArea = area.trim();

                return [
                    trimmedArea.toLowerCase(),
                    trimmedArea,
                ];
            })
        ).values(),
    ];

    return {
        businessType:
            payload.businessType.trim().toLowerCase(),

        businessName:
            payload.businessName.trim(),

        registrationNumber:
            payload.registrationNumber?.trim() || null,

        yearsOfExperience:
            payload.yearsOfExperience ?? 0,

        serviceAreas: normalizedServiceAreas,

        officeAddress:
            payload.officeAddress.trim(),

        bio: payload.bio.trim(),
    };
};

exports.submitApplication = async ({
    user,
    payload,
}) => {
    if (user.role !== "user") {
        throw new ApiError(
            403,
            "Only regular users can submit an agent application"
        );
    }

    const normalizedPayload =
        normalizeApplicationPayload(payload);

    const existingApplication =
        await agentApplicationRepository.findByApplicant(
            user._id
        );

    if (!existingApplication) {
        const application =
            await agentApplicationRepository.create({
                applicant: user._id,
                ...normalizedPayload,
                status: "pending",
                submissionCount: 1,
                submittedAt: new Date(),
            });

        return {
            created: true,
            application,
        };
    }

    if (existingApplication.status === "pending") {
        throw new ApiError(
            409,
            "You already have a pending agent application"
        );
    }

    if (existingApplication.status === "approved") {
        throw new ApiError(
            409,
            "Your agent application has already been approved"
        );
    }

    /*
     * A rejected applicant can update their details
     * and submit the application again.
     */
    existingApplication.set({
        ...normalizedPayload,
        status: "pending",
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        submissionCount:
            existingApplication.submissionCount + 1,
    });

    const application =
        await agentApplicationRepository.save(
            existingApplication
        );

    return {
        created: false,
        application,
    };
};

const validateApplicationId = (applicationId) => {
    if (
        !mongoose.Types.ObjectId.isValid(
            applicationId
        )
    ) {
        throw new ApiError(
            400,
            "Invalid agent application ID"
        );
    }
};

exports.listApplications = async ({
    status,
    page = 1,
    limit = 20,
}) => {
    return agentApplicationRepository
        .findAllForAdmin({
            status,
            page: Number(page),
            limit: Number(limit),
        });
};

exports.getApplicationById = async (
    applicationId
) => {
    validateApplicationId(applicationId);

    const application =
        await agentApplicationRepository
            .findByIdWithDetails(applicationId);

    if (!application) {
        throw new ApiError(
            404,
            "Agent application not found"
        );
    }

    return application;
};

exports.approveApplication = async ({
    applicationId,
    admin,
}) => {
    validateApplicationId(applicationId);

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const application =
                await agentApplicationRepository.findById(
                    applicationId,
                    session
                );

            if (!application) {
                throw new ApiError(
                    404,
                    "Agent application not found"
                );
            }

            if (application.status !== "pending") {
                throw new ApiError(
                    409,
                    `Only pending applications can be approved. Current status: ${application.status}`
                );
            }

            const applicant =
                await userRepository.findById(
                    application.applicant,
                    session
                );

            if (!applicant) {
                throw new ApiError(
                    404,
                    "The applicant account no longer exists"
                );
            }

            if (applicant.role !== "user") {
                throw new ApiError(
                    409,
                    `The applicant cannot be approved because their current role is ${applicant.role}`
                );
            }

            applicant.role = "agent";

            application.status = "approved";
            application.reviewedAt = new Date();
            application.reviewedBy = admin._id;
            application.rejectionReason = null;

            await userRepository.save(
                applicant,
                session
            );

            await agentApplicationRepository.save(
                application,
                session
            );
        });

        return agentApplicationRepository
            .findByIdWithDetails(applicationId);
    } finally {
        await session.endSession();
    }
};

exports.rejectApplication = async ({
    applicationId,
    admin,
    reason,
}) => {
    validateApplicationId(applicationId);

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const application =
                await agentApplicationRepository.findById(
                    applicationId,
                    session
                );

            if (!application) {
                throw new ApiError(
                    404,
                    "Agent application not found"
                );
            }

            if (application.status !== "pending") {
                throw new ApiError(
                    409,
                    `Only pending applications can be rejected. Current status: ${application.status}`
                );
            }

            application.status = "rejected";
            application.reviewedAt = new Date();
            application.reviewedBy = admin._id;
            application.rejectionReason =
                reason.trim();

            await agentApplicationRepository.save(
                application,
                session
            );
        });

        return agentApplicationRepository
            .findByIdWithDetails(applicationId);
    } finally {
        await session.endSession();
    }
};

exports.getMyApplication = async (userId) => {
    const application =
        await agentApplicationRepository
            .findByApplicantWithReviewer(userId);

    if (!application) {
        throw new ApiError(
            404,
            "You have not submitted an agent application"
        );
    }

    return application;
};