"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const App_1 = require("./app/App");
const Logger_1 = require("./app/config/Logger");
// Logger.
const logger = Logger_1.default.getInstance('silly', 'BROKER');
const backupApp = new App_1.default(logger);
backupApp.startApp().then(app => logger.info(`${app.locals.title} started.`))
    .catch((err) => {
    logger.error(`Initialization failed, exiting ${err}.`);
    process.exit(1);
});
