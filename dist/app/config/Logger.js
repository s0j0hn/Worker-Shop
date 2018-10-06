"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
class LoggerFactory {
    constructor() {
        // On purpose.
    }
    static getInstance(level, label) {
        if (!this.loggers.has(level)) {
            this.loggers.set(level, new winston.Logger({
                transports: [
                    new winston.transports.Console({
                        level,
                        label,
                        handleExceptions: true,
                        json: false,
                        prettyPrint: true,
                        colorize: true,
                        timestamp() {
                            return (new Date()).toISOString();
                        },
                    }),
                ],
                exitOnError: false,
            }));
        }
        return this.loggers.get(level);
    }
}
LoggerFactory.loggers = new Map();
exports.default = LoggerFactory;
