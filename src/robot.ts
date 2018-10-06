import winston from 'winston';
import config from './app/config/config';
import Logger from './app/config/Logger';
import JobManager from './app/managers/JobManager';
import RedisManager from './app/managers/RedisManager';
import RobotMananger, { IPosition } from './app/managers/RobotMananger';

const logger: winston.LoggerInstance = Logger.getInstance('silly', 'WORKER');

async function start() {
  // Verify config.
  config.validate();
  ///////////////////////////
  // SET UP THE CONNECTION //
  ///////////////////////////

  const connectionDetails = {
    pkg: 'ioredis',
    host: config.get('redis.host'),
    port: config.get('redis.port'),
    database: 0,
  };

  const redisManager = new RedisManager(logger, connectionDetails);
  await redisManager.initClient();

  //////////////////////////////
  // DEFINE YOUR WORKER TASKS //
  //////////////////////////////

  const jobs = new JobManager(logger, connectionDetails).getJobs();

  //////////////////
  // START WORKER //
  //////////////////

  const initialPoisiton: IPosition = {
    x: config.get('robot.position.x'),
    y: config.get('robot.position.y'),
  };

  const rworker1 = new RobotMananger(logger, connectionDetails, jobs, initialPoisiton, redisManager, `ROBOT-x${initialPoisiton.x}-y${initialPoisiton.y}`);
  await rworker1.initWorker();
}

start();
