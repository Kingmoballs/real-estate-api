const userService = require("./user.service");

exports.getUserStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const status = await userService.getUserStatus(userId);

        res.status(200).json(status);
    } catch (error) {
        next(error);
    }
};