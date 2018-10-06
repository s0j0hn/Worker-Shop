"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const NodeResque = require("node-resque");
class RobotMananger {
    constructor(logger, connexionOptions, jobs, initialPosition, redisManager, id) {
        this.logger = logger;
        this.robotWorker = null;
        this.initialPosition = initialPosition;
        this.id = id;
        this.redisManager = redisManager;
        this.connexionOptions = connexionOptions;
        this.jobs = jobs;
    }
    setPosition(position) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.redisManager.setValue(this.id, JSON.stringify(position));
        });
    }
    getPosition() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.redisManager.getValue(this.id);
        });
    }
    initWorker() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.setPosition(this.initialPosition);
            this.robotWorker = new NodeResque.Worker({ connection: this.connexionOptions, queues: [`orders-x${this.initialPosition.x}-y${this.initialPosition.y}`], name: this.id }, this.jobs);
            yield this.robotWorker.connect();
            this.logger.info('Worker successfully connected to orders.');
            this.robotWorker.on('start', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.logger.info(`Worker ${this.id} STARTED at ${JSON.stringify(this.initialPosition)}`);
                const position = yield this.getPosition();
                this.logger.info(`Worker on position:${position}`);
            }));
            this.robotWorker.on('end', () => { this.logger.debug('worker ended'); });
            this.robotWorker.on('cleaning_worker', (worker2, pid) => { this.logger.debug(`cleaning old worker ${worker2}`); });
            this.robotWorker.on('poll', (queue) => { this.logger.silly(`Worker ${this.id} pooling jobs from ${queue}`); });
            this.robotWorker.on('job', (queue, job) => { this.logger.debug(`Start working  on queue ${queue}`); });
            this.robotWorker.on('reEnqueue', (queue, job, plugin) => { this.logger.debug(`reEnqueue job (${plugin}) ${queue} ${JSON.stringify(job)}`); });
            this.robotWorker.on('success', (queue, job, result) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.logger.info(`Order ${result.orderId} done as successfull`);
            }));
            this.robotWorker.on('failure', (queue, job, failure) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.logger.error(failure);
            }));
            this.robotWorker.on('error', (error, queue, job) => {
                this.logger.error(`Error on queue:${queue} for job ${JSON.stringify(job)} >> ${error}`);
                this.logger.error(`${error}`);
            });
            this.robotWorker.on('pause', () => { this.logger.silly(`Worker ${this.id} PAUSED at ${JSON.stringify(this.initialPosition)}`); });
            yield this.robotWorker.start();
        });
    }
}
exports.default = RobotMananger;
