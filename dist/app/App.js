"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const passport = require("passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("./config/config");
const SeedDb_1 = require("./config/SeedDb");
const Swagger_1 = require("./config/Swagger");
const JobManager_1 = require("./managers/JobManager");
const RedisManager_1 = require("./managers/RedisManager");
const CustomerModel_1 = require("./models/CustomerModel");
const Routes_1 = require("./routes/Routes");
class App {
    constructor(logger) {
        this.logger = logger;
    }
    databaseInit() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield mongoose.connect(config_1.default.get('mongodb.uri'), { useNewUrlParser: true });
            mongoose.connection.on('error', () => {
                this.logger.error('Could not make connection to mongodb. Maybe is not running ...');
                process.exit();
            });
            this.logger.info(`Connected to mongodb: ${config_1.default.get('mongodb.uri')}`);
            if (config_1.default.get('seed')) {
                yield SeedDb_1.seedDb(this.logger);
            }
        });
    }
    initPassport() {
        // Init passport
        this.app.use(passport.initialize());
        this.app.use(passport.session());
        // Add function to check token.
        const opts = {
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config_1.default.get('jwt.secret'),
        };
        passport.use(new passport_jwt_1.Strategy(opts, (jwtPayload, done) => {
            CustomerModel_1.Customer.findOne({ _id: jwtPayload.id }, (err, customer) => {
                if (err) {
                    return done(err, false);
                }
                if (customer) {
                    delete customer.password;
                    return done(null, customer);
                }
                return done(null, false);
            });
        }));
    }
    startApp() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Validate config env.
            config_1.default.validate();
            // Init express.
            this.app = express();
            this.app.use(bodyParser.json());
            this.app.use(bodyParser.urlencoded({ extended: true }));
            // Helmet.
            this.app.use(helmet());
            // CORS.
            this.app.use(cors({
                credentials: true,
                methods: ['POST', 'GET', 'PATCH', 'DELETE', 'OPTIONS'],
            }));
            // Init swagger.
            const swagger = new Swagger_1.default(this.app);
            swagger.loadSwagger();
            // Init database.
            yield this.databaseInit();
            // Init authentication.
            this.initPassport();
            ///////////////////////////
            // SET UP THE CONNECTION //
            ///////////////////////////
            const connectionDetails = {
                pkg: 'ioredis',
                host: config_1.default.get('redis.host'),
                port: config_1.default.get('redis.port'),
                database: 0,
            };
            const redisManager = new RedisManager_1.default(this.logger, connectionDetails);
            yield redisManager.initClient();
            ///////////////////////////////////
            // DEFINE YOUR WORKER JOB QUEUES //
            ///////////////////////////////////
            const jobManager = new JobManager_1.default(this.logger, connectionDetails);
            yield jobManager.initJobManager();
            ////////////
            // ROUIES //
            ////////////
            const router = new Routes_1.default(this.logger, config_1.default, jobManager, passport);
            this.app.use('/', router.getRoutes());
            // App.
            this.app.locals.title = 'Resit API';
            this.app.listen(config_1.default.get('port'), () => {
                this.logger.info('Express server started on 8080.');
            });
            return this.app;
        });
    }
}
exports.default = App;
