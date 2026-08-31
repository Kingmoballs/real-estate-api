const mongoose = require("mongoose");

const ApiError = require("@/shared/utils/ApiError");
const propertyRepository = require("@/modules/property/property.repository");
const inspectionRepository = require("./inspection.repository");
const eventBus = require("@/shared/events/eventBus");
const EVENTS = require("@/shared/events/eventRegistry");

const MINIMUM_NOTICE_HOURS = 2;
const MAXIMUM_ADVANCE_DAYS = 90;

const sameId = (first, second) => {
    const firstId = first?._id || first;
    const secondId = second?._id || second;

    return String(firstId) === String(secondId);
};

const validateObjectId = (id, name) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(
            400,
            `Invalid ${name}`
        );
    }
};

const validateFutureDate = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new ApiError(
            400,
            "Invalid inspection date"
        );
    }

    const minimumDate = new Date(
        Date.now() +
            MINIMUM_NOTICE_HOURS * 60 * 60 * 1000
    );

    const maximumDate = new Date(
        Date.now() +
            MAXIMUM_ADVANCE_DAYS *
                24 *
                60 *
                60 *
                1000
    );

    if (date < minimumDate) {
        throw new ApiError(
            400,
            `Inspection must be requested at least ${MINIMUM_NOTICE_HOURS} hours in advance`
        );
    }

    if (date > maximumDate) {
        throw new ApiError(
            400,
            `Inspection cannot be scheduled more than ${MAXIMUM_ADVANCE_DAYS} days in advance`
        );
    }

    return date;
};

const ensurePublishedProperty = (property) => {
    if (
        !property ||
        property.listingStatus !== "published"
    ) {
        throw new ApiError(
            409,
            "This property is no longer available for inspection"
        );
    }

    if (
        !["rent", "sale"].includes(
            property.listingType
        )
    ) {
        throw new ApiError(
            400,
            "Inspection requests are only available for rent and sale properties"
        );
    }
};

const ensureAgentOrAdmin = ({
    inspection,
    user,
}) => {
    if (user.role === "admin") {
        return;
    }

    if (
        user.role !== "agent" ||
        !sameId(inspection.agent, user._id)
    ) {
        throw new ApiError(
            403,
            "You cannot manage this inspection"
        );
    }
};

const ensureCustomer = ({
    inspection,
    user,
}) => {
    if (
        !sameId(inspection.customer, user._id)
    ) {
        throw new ApiError(
            403,
            "You cannot manage this inspection"
        );
    }
};

const ensureNoScheduleConflict = async ({
    inspection,
    scheduledFor,
}) => {
    const conflict =
        await inspectionRepository.findAgentScheduleConflict(
            {
                agentId:
                    inspection.agent?._id ||
                    inspection.agent,

                scheduledFor,

                excludeInspectionId:
                    inspection._id,
            }
        );

    if (conflict) {
        throw new ApiError(
            409,
            "The agent already has another confirmed inspection around this time"
        );
    }
};

const buildListFilters = (query) => {
    const filters = {};

    if (query.status) {
        filters.status = query.status;
    }

    if (query.property) {
        validateObjectId(
            query.property,
            "property ID"
        );

        filters.property = query.property;
    }

    return filters;
};

const formatInspectionDate = (date) => {
    return new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Lagos",
    }).format(new Date(date));
};

const emitInspectionNotification = ({
    eventName,
    inspectionId,
    recipientId,
    title,
    body,
}) => {
    eventBus.emit(eventName, {
        inspectionId,
        recipientId,
        title,
        body,
    });
};

exports.createInspection = async ({
    user,
    payload,
}) => {
    validateObjectId(
        payload.property,
        "property ID"
    );

    const requestedFor = validateFutureDate(
        payload.requestedFor
    );

    const property =
        await propertyRepository.findPublicById(
            payload.property
        );

    ensurePublishedProperty(property);

    const existing =
        await inspectionRepository.findActiveCustomerRequest(
            {
                propertyId: property._id,
                customerId: user._id,
            }
        );

    if (existing) {
        throw new ApiError(
            409,
            "You already have an active inspection request for this property"
        );
    }

    const agentId =
        property.postedBy?._id ||
        property.postedBy;

    if (sameId(agentId, user._id)) {
        throw new ApiError(
            400,
            "You cannot request an inspection for your own property"
        );
    }

    const inspection =
        await inspectionRepository.create({
            property: property._id,
            customer: user._id,
            agent: agentId,
            requestedFor,
            message: payload.message,
        });

    const detailedInspection =
        await inspectionRepository.findByIdWithDetails(
            inspection._id
        );

    emitInspectionNotification({
        eventName: EVENTS.INSPECTION_CREATED,

        inspectionId:
            detailedInspection._id,

        recipientId:
            detailedInspection.agent._id,

        title: "New Inspection Request",

        body: `${
            detailedInspection.customer.name
        } requested to inspect "${
            detailedInspection.property.title
        }" on ${formatInspectionDate(
            detailedInspection.requestedFor
        )}.`,
    });

    return detailedInspection;
};

exports.getInspectionById = async ({
    inspectionId,
    user,
}) => {
    validateObjectId(
        inspectionId,
        "inspection ID"
    );

    const inspection =
        await inspectionRepository.findByIdWithDetails(
            inspectionId
        );

    if (!inspection) {
        throw new ApiError(
            404,
            "Inspection not found"
        );
    }

    const isCustomer = sameId(
        inspection.customer,
        user._id
    );

    const isAgent = sameId(
        inspection.agent,
        user._id
    );

    if (
        !isCustomer &&
        !isAgent &&
        user.role !== "admin"
    ) {
        throw new ApiError(
            403,
            "You cannot view this inspection"
        );
    }

    return inspection;
};

exports.getMyInspections = ({
    user,
    query,
}) => {
    const filters = buildListFilters(query);
    filters.customer = user._id;

    return inspectionRepository.findPaginated({
        filters,
        page: query.page,
        limit: query.limit,
    });
};

exports.getAgentInspections = ({
    user,
    query,
}) => {
    const filters = buildListFilters(query);
    filters.agent = user._id;

    return inspectionRepository.findPaginated({
        filters,
        page: query.page,
        limit: query.limit,
    });
};

exports.getAdminInspections = ({
    query,
}) => {
    return inspectionRepository.findPaginated({
        filters: buildListFilters(query),
        page: query.page,
        limit: query.limit,
    });
};

exports.confirmInspection = async ({
    inspectionId,
    user,
}) => {
    validateObjectId(
        inspectionId,
        "inspection ID"
    );

    const inspection =
        await inspectionRepository.findByIdWithDetails(
            inspectionId
        );

    if (!inspection) {
        throw new ApiError(
            404,
            "Inspection not found"
        );
    }

    ensureAgentOrAdmin({ inspection, user });
    ensurePublishedProperty(
        inspection.property
    );

    if (inspection.status !== "pending") {
        throw new ApiError(
            409,
            `A ${inspection.status} inspection cannot be confirmed`
        );
    }

    if (inspection.requestedFor <= new Date()) {
        throw new ApiError(
            409,
            "The requested inspection time has passed"
        );
    }

    await ensureNoScheduleConflict({
        inspection,
        scheduledFor:
            inspection.requestedFor,
    });

    inspection.status = "confirmed";
    inspection.scheduledFor =
        inspection.requestedFor;
    inspection.confirmedAt = new Date();

    await inspectionRepository.save(inspection);

    const detailedInspection =
        await inspectionRepository.findByIdWithDetails(
            inspection._id
        );

    emitInspectionNotification({
        eventName:
            EVENTS.INSPECTION_CONFIRMED,

        inspectionId:
            detailedInspection._id,

        recipientId:
            detailedInspection.customer._id,

        title: "Inspection Confirmed",

        body: `Your inspection for "${
            detailedInspection.property.title
        }" has been confirmed for ${formatInspectionDate(
            detailedInspection.scheduledFor
        )}.`,
    });

    return detailedInspection;
};

exports.proposeReschedule = async ({
    inspectionId,
    user,
    payload,
}) => {
    validateObjectId(
        inspectionId,
        "inspection ID"
    );

    const proposedFor = validateFutureDate(
        payload.proposedFor
    );

    const inspection =
        await inspectionRepository.findByIdWithDetails(
            inspectionId
        );

    if (!inspection) {
        throw new ApiError(
            404,
            "Inspection not found"
        );
    }

    ensureAgentOrAdmin({ inspection, user });
    ensurePublishedProperty(
        inspection.property
    );

    if (
        !["pending", "confirmed"].includes(
            inspection.status
        )
    ) {
        throw new ApiError(
            409,
            `A ${inspection.status} inspection cannot be rescheduled`
        );
    }

    await ensureNoScheduleConflict({
        inspection,
        scheduledFor: proposedFor,
    });

    inspection.status =
        "rescheduleProposed";
    inspection.proposedFor = proposedFor;
    inspection.agentMessage =
        payload.message;
    inspection.scheduledFor = null;
    inspection.confirmedAt = null;

    await inspectionRepository.save(inspection);

    const detailedInspection =
        await inspectionRepository.findByIdWithDetails(
            inspection._id
        );

    emitInspectionNotification({
        eventName:
            EVENTS.INSPECTION_RESCHEDULE_PROPOSED,

        inspectionId:
            detailedInspection._id,

        recipientId:
            detailedInspection.customer._id,

        title: "New Inspection Time Proposed",

        body: `The agent proposed ${formatInspectionDate(
            detailedInspection.proposedFor
        )} for your inspection of "${
            detailedInspection.property.title
        }".`,
    });

    return detailedInspection;
};

exports.acceptReschedule = async ({
    inspectionId,
    user,
}) => {
    validateObjectId(
        inspectionId,
        "inspection ID"
    );

    const inspection =
        await inspectionRepository.findByIdWithDetails(
            inspectionId
        );

    if (!inspection) {
        throw new ApiError(
            404,
            "Inspection not found"
        );
    }

    ensureCustomer({ inspection, user });
    ensurePublishedProperty(
        inspection.property
    );

    if (
        inspection.status !==
        "rescheduleProposed"
    ) {
        throw new ApiError(
            409,
            "There is no reschedule proposal to accept"
        );
    }

    if (
        !inspection.proposedFor ||
        inspection.proposedFor <= new Date()
    ) {
        throw new ApiError(
            409,
            "The proposed inspection time has passed"
        );
    }

    await ensureNoScheduleConflict({
        inspection,
        scheduledFor:
            inspection.proposedFor,
    });

    inspection.status = "confirmed";
    inspection.scheduledFor =
        inspection.proposedFor;
    inspection.proposedFor = null;
    inspection.confirmedAt = new Date();

    await inspectionRepository.save(inspection);

    const detailedInspection =
        await inspectionRepository.findByIdWithDetails(
            inspection._id
        );

    emitInspectionNotification({
        eventName:
            EVENTS.INSPECTION_RESCHEDULE_ACCEPTED,

        inspectionId:
            detailedInspection._id,

        recipientId:
            detailedInspection.agent._id,

        title:
            "Inspection Reschedule Accepted",

        body: `${
            detailedInspection.customer.name
        } accepted the new inspection time for "${
            detailedInspection.property.title
        }": ${formatInspectionDate(
            detailedInspection.scheduledFor
        )}.`,
    });

    return detailedInspection;
};

exports.rejectInspection = async ({
    inspectionId,
    user,
    reason,
}) => {
    validateObjectId(
        inspectionId,
        "inspection ID"
    );

    const inspection =
        await inspectionRepository.findByIdWithDetails(
            inspectionId
        );

    if (!inspection) {
        throw new ApiError(
            404,
            "Inspection not found"
        );
    }

    ensureAgentOrAdmin({ inspection, user });

    if (
        ![
            "pending",
            "rescheduleProposed",
        ].includes(inspection.status)
    ) {
        throw new ApiError(
            409,
            `A ${inspection.status} inspection cannot be rejected`
        );
    }

    inspection.status = "rejected";
    inspection.rejectionReason = reason;
    inspection.rejectedAt = new Date();
    inspection.scheduledFor = null;
    inspection.proposedFor = null;

    await inspectionRepository.save(inspection);

    const detailedInspection =
        await inspectionRepository.findByIdWithDetails(
            inspection._id
        );

    emitInspectionNotification({
        eventName:
            EVENTS.INSPECTION_REJECTED,

        inspectionId:
            detailedInspection._id,

        recipientId:
            detailedInspection.customer._id,

        title: "Inspection Rejected",

        body: `Your inspection request for "${
            detailedInspection.property.title
        }" was rejected. Reason: ${reason}`,
    });

    return detailedInspection;
};

exports.cancelInspection = async ({
    inspectionId,
    user,
    reason,
}) => {
    validateObjectId(
        inspectionId,
        "inspection ID"
    );

    const inspection =
        await inspectionRepository.findByIdWithDetails(
            inspectionId
        );

    if (!inspection) {
        throw new ApiError(
            404,
            "Inspection not found"
        );
    }

    const isCustomer = sameId(
        inspection.customer,
        user._id
    );

    const isAgent = sameId(
        inspection.agent,
        user._id
    );

    if (
        !isCustomer &&
        !isAgent &&
        user.role !== "admin"
    ) {
        throw new ApiError(
            403,
            "You cannot cancel this inspection"
        );
    }

    if (
        ![
            "pending",
            "confirmed",
            "rescheduleProposed",
        ].includes(inspection.status)
    ) {
        throw new ApiError(
            409,
            `A ${inspection.status} inspection cannot be cancelled`
        );
    }

    inspection.status = "cancelled";
    inspection.cancellationReason = reason;
    inspection.cancelledBy = user._id;
    inspection.cancelledAt = new Date();
    inspection.scheduledFor = null;
    inspection.proposedFor = null;

    await inspectionRepository.save(inspection);

    const detailedInspection =
        await inspectionRepository.findByIdWithDetails(
            inspection._id
        );

    const recipientId = isCustomer
        ? detailedInspection.agent._id
        : detailedInspection.customer._id;

    const cancelledByName =
        user.name || "A participant";

    emitInspectionNotification({
        eventName:
            EVENTS.INSPECTION_CANCELLED,

        inspectionId:
            detailedInspection._id,

        recipientId,

        title: "Inspection Cancelled",

        body: `${cancelledByName} cancelled the inspection for "${detailedInspection.property.title}". Reason: ${reason}`,
    });

    return detailedInspection;
};

exports.completeInspection = async ({
    inspectionId,
    user,
}) => {
    validateObjectId(
        inspectionId,
        "inspection ID"
    );

    const inspection =
        await inspectionRepository.findByIdWithDetails(
            inspectionId
        );

    if (!inspection) {
        throw new ApiError(
            404,
            "Inspection not found"
        );
    }

    ensureAgentOrAdmin({ inspection, user });

    if (inspection.status !== "confirmed") {
        throw new ApiError(
            409,
            "Only confirmed inspections can be completed"
        );
    }

    if (
        !inspection.scheduledFor ||
        inspection.scheduledFor > new Date()
    ) {
        throw new ApiError(
            409,
            "Inspection cannot be completed before its scheduled time"
        );
    }

    inspection.status = "completed";
    inspection.completedAt = new Date();

    await inspectionRepository.save(inspection);

    const detailedInspection =
        await inspectionRepository.findByIdWithDetails(
            inspection._id
        );

    emitInspectionNotification({
        eventName:
            EVENTS.INSPECTION_COMPLETED,

        inspectionId:
            detailedInspection._id,

        recipientId:
            detailedInspection.customer._id,

        title: "Inspection Completed",

        body: `Your inspection for "${detailedInspection.property.title}" has been marked as completed.`,
    });

    return detailedInspection;
};