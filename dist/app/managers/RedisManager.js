"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const asyncRedis = require("async-redis/src");
const redis = require("redis");
const config_1 = require("../config/config");
class RedisManager {
    constructor(logger, connexionOptions) {
        this.connexionOptions = connexionOptions;
        this.logger = logger;
    }
    initClient() {
        this.client = redis.createClient(this.connexionOptions);
        this.client.on('error', () => {
            this.logger.error('Could not make connection to redis. Maybe it\'s not running ...');
            process.exit();
        });
        this.client = asyncRedis.decorate(this.client);
        this.logger.info(`Connected to redis: ${config_1.default.get('redis.host')}`);
    }
    getValue(key) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.client.get(key);
        });
    }
    setValue(key, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.client.set(key, value);
        });
    }
}
exports.default = RedisManager;
