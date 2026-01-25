const propertyRepository = require("../repositories/propertyRepository");
const bookingRepository = require("../repositories/bookingRepository");

const getDateRange = (type) => {
    const end = new Date();
    const start = new Date();

    switch (type) {
        case "today":
            start.setHours(0, 0, 0, 0);
            break;

        case "7days":
            start.setDate(start.getDate() - 7);
            break;

        case "30days":
            start.setDate(start.getDate() - 30);
            break;

        default:
            return null;
    }

    return { start, end };
};

// Get dashboard data for agent
exports.getAgentDashboard = async (agentId, rangeType) => {
    const agentProperties = await propertyRepository.findByAgent(agentId, ["_id"]);
    const propertyIds = agentProperties.map(p => p._id);

    const baseStats = {
        totalProperties: await propertyRepository.countByAgent(agentId),
        totalBookings: await bookingRepository.countByProperties(propertyIds),
        totalRevenue: await bookingRepository.calculateTotalRevenue(propertyIds),
    };

    let dateAnalytics = null;

    if (rangeType) {
        const range = getDateRange(rangeType);

        if (range) {
            const stats = await bookingRepository.getStatsByDateRange({
                propertyIds,
                startDate: range.start,
                endDate: range.end,
            });

            dateAnalytics = {
                range: rangeType,
                totalBookings: stats[0]?.totalBookings || 0,
                totalRevenue: stats[0]?.totalRevenue || 0,
            };
        }
    }

    return {
        summary: baseStats,
        dateAnalytics,
    };
};

