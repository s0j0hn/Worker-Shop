import * as NodeResque from 'node-resque';
import * as winston from 'winston';
import { IJob } from './JobManager';
import RedisManager from './RedisManager';

export interface IPosition {
  x: number;
  y: number;
}

class RobotMananger {
  private robotWorker: NodeResque.Worker;
  private logger: winston.LoggerInstance;
  private connexionOptions: NodeResque.ConnectionOptions;
  private jobs: NodeResque.JobsHash;
  private readonly initialPosition: IPosition;
  private redisManager: RedisManager;
  private id: string;

  constructor(
    logger: winston.LoggerInstance,
    connexionOptions: NodeResque.ConnectionOptions,
    jobs: NodeResque.JobsHash,
    initialPosition: IPosition,
    redisManager: RedisManager,
    id: string,
  ) {
    this.logger = logger;
    this.robotWorker = null;
    this.initialPosition = initialPosition;
    this.id = id;
    this.redisManager = redisManager;
    this.connexionOptions = connexionOptions;
    this.jobs = jobs;
  }

  public async setPosition(position: IPosition): Promise<void> {
    await this.redisManager.setValue(this.id, JSON.stringify(position));
  }

  public async getPosition(): Promise<string> {
    return await this.redisManager.getValue(this.id);
  }

  public async initWorker(): Promise<void> {
    await this.setPosition(this.initialPosition);

    this.robotWorker = new NodeResque.Worker({ connection: this.connexionOptions, queues: [`orders-x${this.initialPosition.x}-y${this.initialPosition.y}`], name: this.id }, this.jobs);
    await this.robotWorker.connect();
    this.logger.info('Worker successfully connected to orders.');

    this.robotWorker.on('start', async () => {
      this.logger.info(`Worker ${this.id} STARTED at ${JSON.stringify(this.initialPosition)}`);
      const position = await this.getPosition();
      this.logger.info(`Worker on position:${position}`);
    });
    this.robotWorker.on('end', () => { this.logger.debug('worker ended'); });
    this.robotWorker.on('cleaning_worker', (worker2, pid) => { this.logger.debug(`cleaning old worker ${worker2}`); });
    this.robotWorker.on('poll', (queue) => { this.logger.silly(`Worker ${this.id} pooling jobs from ${queue}`); });
    this.robotWorker.on('job', (queue, job) => { this.logger.debug(`Start working  on queue ${queue}`); });
    this.robotWorker.on('reEnqueue', (queue, job, plugin) => { this.logger.debug(`reEnqueue job (${plugin}) ${queue} ${JSON.stringify(job)}`); });
    this.robotWorker.on('success', async (queue, job, result: IJob) => {
      this.logger.info(`Order ${result.orderId} done as successfull`);
    });
    this.robotWorker.on('failure', async (queue, job, failure) => {
      this.logger.error(failure);
    });
    this.robotWorker.on('error', (error, queue, job) => {
      this.logger.error(`Error on queue:${queue} for job ${JSON.stringify(job)} >> ${error}`);
      this.logger.error(`${error}`);
    });
    this.robotWorker.on('pause', () => { this.logger.silly(`Worker ${this.id} PAUSED at ${JSON.stringify(this.initialPosition)}`); });

    await this.robotWorker.start();
  }
}

export default RobotMananger;
