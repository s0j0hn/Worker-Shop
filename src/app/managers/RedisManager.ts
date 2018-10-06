import * as asyncRedis from 'async-redis/src';
import * as NodeResque from 'node-resque';
import * as redis from 'redis';
import * as winston from 'winston';
import config from '../config/config';

class RedisManager {
  private client: redis.RedisClient;
  private connexionOptions: NodeResque.ConnectionOptions;
  private logger: winston.LoggerInstance;

  constructor(logger: winston.LoggerInstance, connexionOptions: NodeResque.ConnectionOptions) {
    this.connexionOptions = connexionOptions;
    this.logger = logger;
  }

  public initClient(): void {
    this.client = redis.createClient(this.connexionOptions);
    this.client.on('error', () => {
      this.logger.error('Could not make connection to redis. Maybe it\'s not running ...');
      process.exit();
    });
    this.client = asyncRedis.decorate(this.client);
    this.logger.info(`Connected to redis: ${config.get('redis.host')}`);
  }

  public async getValue(key: string): Promise<any> {
    return await this.client.get(key);
  }

  public async setValue(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }
}

export default RedisManager;
