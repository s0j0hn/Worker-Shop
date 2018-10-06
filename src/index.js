"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app/app");
const config_1 = require("./app/config/config");
const LoggerFactory_1 = require("./app/config/LoggerFactory");
// Logger.
const logger = LoggerFactory_1.default.getInstance(config_1.default.get('logs.app'));
// app.
const backupApp = new app_1.default(logger);
backupApp.startApp().then(app => logger.info(`${app.locals.title} started.`))
    .catch((err) => {
    logger.error(`Backup initialization failed, exiting ${err}.`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map