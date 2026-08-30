const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDateOnly = (value) => {
    if (value instanceof Date) {
        const normalized = new Date(value);
        normalized.setUTCHours(0, 0, 0, 0);
        return normalized;
    }

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    return parsed;
};

const startOfUtcDay = (value = new Date()) => {
    const date = new Date(value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

const calculateNights = (checkInDate, checkOutDate) => {
    const start = parseDateOnly(checkInDate);
    const end = parseDateOnly(checkOutDate);

    if (!start || !end || end <= start) {
        return 0;
    }

    return Math.round((end - start) / MS_PER_DAY);
};

const shouldActivateBooking = (
    checkInDate,
    now = new Date()
) => {
    const start = parseDateOnly(checkInDate);

    if (!start) {
        return false;
    }

    return start <= startOfUtcDay(now);
};

const buildPropertyBookingLockKey = (propertyId) =>
    `booking:property:${propertyId}`;

module.exports = {
    MS_PER_DAY,
    parseDateOnly,
    startOfUtcDay,
    calculateNights,
    shouldActivateBooking,
    buildPropertyBookingLockKey,
};
