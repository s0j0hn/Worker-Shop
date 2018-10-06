"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const PromiseBlue = require("bluebird");
const NodeResque = require("node-resque");
/**
 * Simulate catch of object.
 * @param min
 * @param max
 * @returns {number}
 */
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.getRndInteger = getRndInteger;
/**
 * Simulate grabbing the object by robot.
 * @param {IJobProduct} product
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<void>}
 */
function grabbingObject(product, logger) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve2) => { setTimeout(resolve2, 2000); });
        logger.debug(`Trying to get the product uuid: ${product.uuid}`);
        yield new Promise((resolve2) => { setTimeout(resolve2, 8000); });
        if (getRndInteger(1, 3) === 2) {
            logger.error('Failed grabing the product! Retrying in 5000 ms');
            yield new Promise((resolve2) => { setTimeout(resolve2, 5000); });
            grabbingObject(product, logger);
        }
        else {
            logger.info(`Success grabing the object of color:${product.zone.color} and uuid: ${product.uuid}`);
            yield new Promise((resolve2) => { setTimeout(resolve2, 2000); });
        }
    });
}
exports.grabbingObject = grabbingObject;
/**
 * Calculate the simulation time between points for robot and return the position and time.
 * @param {IEntry[]} positions
 * @param {IEntry} orderPosition
 * @returns {Promise<ITimePosition>}
 */
function calculateTime(positions, orderPosition) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const smallestPosition = positions.sort((a, b) => a.x - b.y)[0];
        const time = (yield Math.abs((smallestPosition.x - orderPosition.x) * 1000)) + ((smallestPosition.y - orderPosition.y) * 1000);
        return {
            time,
            position: smallestPosition,
        };
    });
}
exports.calculateTime = calculateTime;
/**
 * Move to initial point of the order done by customer.
 * @param {IEntry[]} positions
 * @param {IEntry} orderPosition
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<void>}
 */
function moveBackToCustomers(positions, orderPosition, logger) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const timeAndPosition = yield calculateTime(positions, orderPosition);
        logger.debug(`Moving back to customers at ${JSON.stringify(timeAndPosition.position)} for ${timeAndPosition.time}`);
        yield new Promise((resolve) => { setTimeout(resolve, timeAndPosition.time); });
    });
}
exports.moveBackToCustomers = moveBackToCustomers;
/**
 * Simulate the move to closest point calculated and return it.
 * @param {IEntry[]} positions
 * @param {IEntry} orderPosition
 * @param {IJobProductZone} zone
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<IEntry>}
 */
function moveToClosest(positions, orderPosition, zone, logger) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger.debug(`Preparing to move to zone: ${zone.color} of uuid: ${zone.uuid}`);
        const timeAndPosition = yield calculateTime(positions, orderPosition);
        logger.debug(`Moving from ${JSON.stringify(orderPosition)} to zone color: ${zone.color} for ${timeAndPosition.time}`);
        yield new Promise((resolve) => { setTimeout(resolve, timeAndPosition.time); });
        logger.debug(`Stoping at ${JSON.stringify(timeAndPosition.position)} closest zone of color: ${zone.color}`);
        return timeAndPosition.position;
    });
}
exports.moveToClosest = moveToClosest;
/**
 *
 * @param {string} orderId
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<void>}
 */
function giveProducts(orderId, logger) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger.debug('Giving the object');
        yield new Promise((resolve) => { setTimeout(resolve, 5000); });
        logger.debug('Updating database...');
    });
}
exports.giveProducts = giveProducts;
class JobManager {
    constructor(logger, connexionOptions) {
        this.logger = logger;
        this.connexionOptions = connexionOptions;
    }
    initJobManager() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.client = new NodeResque.Queue({ connection: this.connexionOptions }, this.getJobs());
            yield this.client.connect();
            this.client.on('error', (error) => { this.logger.error(`${error}`); });
        });
    }
    getJobs() {
        return {
            getProduct: {
                plugins: ['JobLock'],
                pluginOptions: {
                    JobLock: {},
                },
                /**
                 * Perform the simulation job to be done by robots.
                 * @param {string} orderId
                 * @param {string} userId
                 * @param {IJobProduct[]} products
                 * @param {string} worker
                 * @param {IEntry} orderPosition
                 * @returns {Promise<IJob>}
                 */
                perform: (orderId, userId, products, worker, orderPosition) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    let position = orderPosition;
                    yield PromiseBlue.each(products, (product) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        position = yield moveToClosest(product.zone.entries, orderPosition, product.zone, this.logger);
                        yield grabbingObject(product, this.logger);
                    }));
                    yield moveBackToCustomers([position], orderPosition, this.logger);
                    yield giveProducts(orderId, this.logger);
                    return {
                        orderPosition,
                        orderId,
                        userId,
                        products,
                        worker,
                    };
                }),
            },
        };
    }
    createJob(job) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.client.enqueue(`orders-x${job.orderPosition.x}-y${job.orderPosition.y}`, 'getProduct', [job.orderId, job.userId, job.products, job.worker, job.orderPosition]);
            return job;
        });
    }
    getWorkers() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.client.workers();
        });
    }
    getStats() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.client.stats();
        });
    }
}
exports.default = JobManager;
