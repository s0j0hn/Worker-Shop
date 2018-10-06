import * as PromiseBlue from 'bluebird';
import * as NodeResque from 'node-resque';
import * as winston from 'winston';
import { IEntry } from '../models/ZoneModel';

export interface IJobProductZone {
  uuid?: string;
  unit: number;
  color?: 'blue' | 'orange' | 'green' | 'yellow' | 'purple' | 'white' | 'brown' | 'red';
  entries?: IEntry[];
}

export interface ITimePosition {
  time: number;
  position: IEntry;
}

export interface IJobProduct {
  uuid: string;
  unit: number;
  zone?: IJobProductZone;
  product?: string;
}

export interface IJob {
  orderPosition: IEntry;
  orderId: string;
  userId: string;
  products: IJobProduct[];
  worker: string;
}

/**
 * Simulate catch of object.
 * @param min
 * @param max
 * @returns {number}
 */
export function getRndInteger(min, max): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simulate grabbing the object by robot.
 * @param {IJobProduct} product
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<void>}
 */
export async function grabbingObject(product: IJobProduct, logger: winston.LoggerInstance) {
  await new Promise((resolve2) => { setTimeout(resolve2, 2000); });
  logger.debug(`Trying to get the product uuid: ${product.uuid}`);
  await new Promise((resolve2) => { setTimeout(resolve2, 8000); });
  if (getRndInteger(1, 3) === 2) {
    logger.error('Failed grabing the product! Retrying in 5000 ms');
    await new Promise((resolve2) => { setTimeout(resolve2, 5000); });
    grabbingObject(product, logger);
  } else {
    logger.info(`Success grabing the object of color:${product.zone.color} and uuid: ${product.uuid}`);
    await new Promise((resolve2) => { setTimeout(resolve2, 2000); });
  }
}

/**
 * Calculate the simulation time between points for robot and return the position and time.
 * @param {IEntry[]} positions
 * @param {IEntry} orderPosition
 * @returns {Promise<ITimePosition>}
 */
export async function calculateTime(positions: IEntry[], orderPosition: IEntry): Promise<ITimePosition> {
  const smallestPosition = positions.sort((a, b) => a.x - b.y)[0];
  const time = await Math.abs((smallestPosition.x - orderPosition.x) * 1000) + ((smallestPosition.y - orderPosition.y) * 1000);
  return {
    time,
    position: smallestPosition,
  };
}

/**
 * Move to initial point of the order done by customer.
 * @param {IEntry[]} positions
 * @param {IEntry} orderPosition
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<void>}
 */
export async function moveBackToCustomers(positions: IEntry[], orderPosition: IEntry, logger: winston.LoggerInstance): Promise<void> {
  const timeAndPosition = await calculateTime(positions, orderPosition);
  logger.debug(`Moving back to customers at ${JSON.stringify(timeAndPosition.position)} for ${timeAndPosition.time}`);
  await new Promise((resolve) => { setTimeout(resolve, timeAndPosition.time); });

}

/**
 * Simulate the move to closest point calculated and return it.
 * @param {IEntry[]} positions
 * @param {IEntry} orderPosition
 * @param {IJobProductZone} zone
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<IEntry>}
 */
export async function moveToClosest(positions: IEntry[], orderPosition: IEntry, zone: IJobProductZone, logger: winston.LoggerInstance): Promise<IEntry> {
  logger.debug(`Preparing to move to zone: ${zone.color} of uuid: ${zone.uuid}`);
  const timeAndPosition = await calculateTime(positions, orderPosition);
  logger.debug(`Moving from ${JSON.stringify(orderPosition)} to zone color: ${zone.color} for ${timeAndPosition.time}`);
  await new Promise((resolve) => { setTimeout(resolve, timeAndPosition.time); });
  logger.debug(`Stoping at ${JSON.stringify(timeAndPosition.position)} closest zone of color: ${zone.color}`);
  return timeAndPosition.position;
}

/**
 *
 * @param {string} orderId
 * @param {winston.LoggerInstance} logger
 * @returns {Promise<void>}
 */
export async function giveProducts(orderId: string, logger: winston.LoggerInstance): Promise<void> {
  logger.debug('Giving the object');
  await new Promise((resolve) => { setTimeout(resolve, 5000); });
  logger.debug('Updating database...');
}

class JobManager {
  private client: NodeResque.Queue;
  private logger: winston.LoggerInstance;
  private connexionOptions: NodeResque.ConnectionOptions;

  constructor(logger: winston.LoggerInstance, connexionOptions: NodeResque.ConnectionOptions) {
    this.logger = logger;
    this.connexionOptions = connexionOptions;
  }

  public async initJobManager(): Promise<void> {
    this.client = new NodeResque.Queue({ connection: this.connexionOptions }, this.getJobs());
    await this.client.connect();
    this.client.on('error', (error) => { this.logger.error(`${error}`); });
  }

  public getJobs(): NodeResque.JobsHash {
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
        perform: async (orderId: string, userId: string, products: IJobProduct[], worker: string, orderPosition: IEntry): Promise<IJob> => {
          let position = orderPosition;
          await PromiseBlue.each(products, async (product) => {
            position = await moveToClosest(product.zone.entries, orderPosition, product.zone, this.logger);
            await grabbingObject(product, this.logger);
          });
          await moveBackToCustomers([position], orderPosition, this.logger);
          await giveProducts(orderId, this.logger);
          return {
            orderPosition,
            orderId,
            userId,
            products,
            worker,
          };
        },
      },
    };
  }

  public async createJob(job: IJob): Promise<IJob> {
    await this.client.enqueue(
      `orders-x${job.orderPosition.x}-y${job.orderPosition.y}`,
      'getProduct', [job.orderId, job.userId, job.products, job.worker, job.orderPosition]);

    return job;
  }

  public async getWorkers(): Promise<object> {
    return await (this.client as any).workers();
  }

  public async getStats(): Promise<object> {
    return await (this.client as any).stats();
  }
}

export default JobManager;
