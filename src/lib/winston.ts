import winston from "winston";

import config from "@/config";

const { combine, timestamp, json, printf, colorize, errors, align, prettyPrint } = winston.format;

const transports: winston.transport[] = []

if (config.NODE_ENV !== 'Production') {
    transports.push(
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'YYYY-MM-DD hh-mm-ss A' }),
                json(),
                align(),
                printf(({ timestamp, level, message, ...meta }) => {
                    const metaSrc = Object.keys(meta).length ? `\n${JSON.stringify(meta)}`
                        : '';
                     
                    return `${timestamp} [${level.toUpperCase()}]: ${message}${meta}`;
                })
            )
        })
    );

}

const logger = winston.createLogger({
    level: config.LOG_LEVEL || "info",
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports,
    silent: config.NODE_ENV === "test", //Disable Logging in test environment
})

export default logger;