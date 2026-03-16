const logger = require("./logger");

const httpLogger = (req, res, next) => {
    const { method, originalUrl, ip } = req;
    const start = Date.now();

    res.on("finish", () => {
        const { statusCode } = res;
        const duration = Date.now() - start;
        const logMessage = `${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip}`;

        if (statusCode >= 400) {
            logger.error(logMessage);
        } else {
            logger.info(logMessage);
        }
    });

    next();
};

module.exports = httpLogger;
