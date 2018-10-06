import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as helmet from 'helmet';
import * as mongoose from 'mongoose';
import * as NodeResque from 'node-resque';
import * as passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as winston from 'winston';
import config from './config/config';
import { seedDb } from './config/SeedDb';
import Swagger from './config/Swagger';
import JobManager from './managers/JobManager';
import RedisManager from './managers/RedisManager';
import { Customer } from './models/CustomerModel';
import Routes from './routes/Routes';

class App {
  private app: express.Application;
  private logger: winston.LoggerInstance;

  public constructor(logger: winston.LoggerInstance) {
    this.logger = logger;
  }

  private async databaseInit(): Promise<void> {
    await mongoose.connect(config.get('mongodb.uri'),  { useNewUrlParser: true });
    mongoose.connection.on('error', () => {
      this.logger.error('Could not make connection to mongodb. Maybe is not running ...');
      process.exit();
    });

    this.logger.info(`Connected to mongodb: ${config.get('mongodb.uri')}`);
    if (config.get('seed')) {
      await seedDb(this.logger);
    }
  }

  private initPassport(): void {
    // Init passport
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // Add function to check token.
    const opts = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('jwt.secret'),
    };

    passport.use(new Strategy(opts, (jwtPayload, done) => {
      Customer.findOne({ _id: jwtPayload.id }, (err, customer) => {
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

  public async startApp(): Promise<express.Application> {
    // Validate config env.
    config.validate();
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
    const swagger = new Swagger(this.app);
    swagger.loadSwagger();

    // Init database.
    await this.databaseInit();

    // Init authentication.
    this.initPassport();

    ///////////////////////////
    // SET UP THE CONNECTION //
    ///////////////////////////

    const connectionDetails: NodeResque.ConnectionOptions = {
      pkg: 'ioredis',
      host: config.get('redis.host'),
      port: config.get('redis.port'),
      database: 0,
    };

    const redisManager = new RedisManager(this.logger, connectionDetails);
    await redisManager.initClient();

    ///////////////////////////////////
    // DEFINE YOUR WORKER JOB QUEUES //
    ///////////////////////////////////

    const jobManager = new JobManager(this.logger, connectionDetails);
    await jobManager.initJobManager();

    ////////////
    // ROUIES //
    ////////////

    const router = new Routes(this.logger, config, jobManager, passport);
    this.app.use('/', router.getRoutes());

    // App.
    this.app.locals.title = 'Resit API';
    this.app.listen(config.get('port'), () => {
      this.logger.info('Express server started on 8080.');
    });

    return this.app;
  }
}

export default App;
