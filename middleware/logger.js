const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.errors({ stack: true }), // <-- include stack traces automatically
        format.printf(
        (info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
        )
    ),
    transports: [
        // Console output
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(
                (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
                )
            ),
        }),

        // Daily rotating app logs (all info levels)
        new DailyRotateFile({
            filename: "logs/app-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d",
        }),

        // Daily rotating error logs
        new DailyRotateFile({
            level: "error",
            filename: "logs/error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "30d",
        }),
    ],
});

module.exports = logger;
