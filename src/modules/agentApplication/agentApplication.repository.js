const AgentApplication = require(
    "./agentApplication.model"
);

exports.create = (applicationData) => {
    return AgentApplication.create(applicationData);
};

exports.findByApplicant = (applicantId) => {
    return AgentApplication.findOne({
        applicant: applicantId,
    });
};

exports.findByApplicantWithReviewer = (applicantId) => {
    return AgentApplication.findOne({
        applicant: applicantId,
    })
        .populate(
            "applicant",
            "name email phone role"
        )
        .populate(
            "reviewedBy",
            "name email"
        );
};

exports.findById = (
    applicationId,
    session = null
) => {
    const query =
        AgentApplication.findById(applicationId);

    if (session) {
        query.session(session);
    }

    return query;
};

exports.findByIdWithDetails = (applicationId) => {
    return AgentApplication.findById(applicationId)
        .populate(
            "applicant",
            "name email phone role"
        )
        .populate(
            "reviewedBy",
            "name email"
        );
};

exports.findAllForAdmin = async ({
    status,
    page,
    limit,
}) => {
    const filter = {};

    if (status) {
        filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [applications, totalItems] =
        await Promise.all([
            AgentApplication.find(filter)
                .populate(
                    "applicant",
                    "name email phone role"
                )
                .populate(
                    "reviewedBy",
                    "name email"
                )
                .sort({
                    submittedAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            AgentApplication.countDocuments(filter),
        ]);

    const totalPages = Math.ceil(
        totalItems / limit
    );

    return {
        applications,
        pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

exports.save = (
    application,
    session = null
) => {
    if (session) {
        return application.save({ session });
    }

    return application.save();
};