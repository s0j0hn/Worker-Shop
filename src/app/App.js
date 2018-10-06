"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const expressWinston = require("express-winston");
const helmet = require("helmet");
const config_1 = require("./config/config");
const Swagger_1 = require("./config/Swagger");
class App {
    constructor(logger) {
        this.logger = logger;
    }
    startApp() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Init express.
            this.app = express();
            this.app.use(bodyParser.json());
            this.app.use(bodyParser.urlencoded({ extended: true }));
            // Helmet.
            this.app.use(helmet());
            // CORS.
            this.app.use(cors({
                credentials: true,
                exposedHeaders: ['Location'],
                methods: ['POST', 'GET', 'PATCH', 'DELETE', 'OPTIONS'],
            }));
            // HTTP logs.
            this.app.use(expressWinston.logger({ winstonInstance: this.logger, level: config_1.default.get('logs.http') }));
            // const routes = new Routes(this.logger, config, iamTokenReader, configurationManager);
            // this.app.use('/', routes.routes());
            // HTTP error logs.
            this.app.use(expressWinston.errorLogger({ winstonInstance: this.logger }));
            // Init swagger.
            const swagger = new Swagger_1.default(this.app);
            swagger.loadSwagger();
            // App.
            this.app.locals.title = 'Backup';
            this.app.listen(8080, () => {
                this.logger.info('Express server started on 8080.');
            });
            return this.app;
        });
    }
}
exports.default = App;
//# sourceMappingURL=App.js.map