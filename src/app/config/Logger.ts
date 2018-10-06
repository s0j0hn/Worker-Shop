import * as winston from 'winston';

class LoggerFactory {
  private static loggers: Map<string, winston.LoggerInstance> = new Map<string, winston.LoggerInstance>();

  public static getInstance(level: string, label: string): winston.LoggerInstance {
    if (!this.loggers.has(level)) {
      this.loggers.set(level, new winston.Logger({
        transports: [
          new winston.transports.Console({
            level,
            label,
            handleExceptions: true, // Handles uncaught exceptions.
            json: false,
            prettyPrint: true,
            colorize: true,
            timestamp() {
              return (new Date()).toISOString();
            },
          }),
        ],
        exitOnError: false, // Otherwise winston will exit after logging an uncaughtException.
      }));
    }

    return this.loggers.get(level);
  }

  private constructor() {
    // On purpose.
  }
}

export default LoggerFactory;
