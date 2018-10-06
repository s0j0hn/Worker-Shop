"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = require("./app/config/config");
const Logger_1 = require("./app/config/Logger");
const JobManager_1 = require("./app/managers/JobManager");
const RedisManager_1 = require("./app/managers/RedisManager");
const RobotMananger_1 = require("./app/managers/RobotMananger");
const logger = Logger_1.default.getInstance('silly', 'WORKER');
function start() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // Verify config.
        config_1.default.validate();
        ///////////////////////////
        // SET UP THE CONNECTION //
        ///////////////////////////
        const connectionDetails = {
            pkg: 'ioredis',
            host: config_1.default.get('redis.host'),
            port: config_1.default.get('redis.port'),
            database: 0,
        };
        const redisManager = new RedisManager_1.default(logger, connectionDetails);
        yield redisManager.initClient();
        //////////////////////////////
        // DEFINE YOUR WORKER TASKS //
        //////////////////////////////
        const jobs = new JobManager_1.default(logger, connectionDetails).getJobs();
        //////////////////
        // START WORKER //
        //////////////////
        const initialPoisiton = {
            x: config_1.default.get('robot.position.x'),
            y: config_1.default.get('robot.position.y'),
        };
        const rworker1 = new RobotMananger_1.default(logger, connectionDetails, jobs, initialPoisiton, redisManager, `ROBOT-x${initialPoisiton.x}-y${initialPoisiton.y}`);
        yield rworker1.initWorker();
    });
}
start();
