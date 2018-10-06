import winston from 'winston';
import App from './app/App';
import Logger from './app/config/Logger';

// Logger.
const logger: winston.LoggerInstance = Logger.getInstance('silly', 'BROKER');

const backupApp: App = new App(logger);
backupApp.startApp().then(app => logger.info(`${app.locals.title} started.`))
  .catch((err) => {
    logger.error(`Initialization failed, exiting ${err}.`);
    process.exit(1);
  });
