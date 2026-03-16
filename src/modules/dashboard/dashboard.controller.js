const dashboardService = require("./dashboard.service");

// Get dashboard data for agent
exports.getAgentDashboard = async (req, res, next) => {
    try {
        const range = req.query.range; // today | 7days | 30days
        const dashboard = await dashboardService.getAgentDashboard(
            req.user.id,
            range
        );
        res.status(200).json(dashboard);
    } catch (err) {
        next(err);
    }
};

