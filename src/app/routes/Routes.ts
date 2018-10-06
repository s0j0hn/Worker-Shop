import * as PromiseBlue from 'bluebird';
import * as express from 'express';
import * as validator from 'express-validator/check';
import * as jwt from 'jsonwebtoken';
import { PassportStatic } from 'passport';
import * as winston from 'winston';
import JobManager, { IJob, IJobProduct } from '../managers/JobManager';
import { Customer } from '../models/CustomerModel';
import { IOrderProduct, Order } from '../models/OrderModel';
import { Product } from '../models/ProductModel';
import { Zone } from '../models/ZoneModel';

class Routes {
  private jobManager: JobManager;
  private logger: winston.LoggerInstance;
  private passport: PassportStatic;
  private config: any;

  constructor(logger: winston.LoggerInstance, config: any, jobManager: JobManager, passport: PassportStatic) {
    this.config = config;
    this.logger = logger;
    this.jobManager = jobManager;
    this.passport = passport;
    this.createOrder = this.createOrder.bind(this);
    this.getWorkers = this.getWorkers.bind(this);
    this.getProducts = this.getProducts.bind(this);
    this.createCustomer = this.createCustomer.bind(this);
    this.createCustomerToken = this.createCustomerToken.bind(this);
    this.getStats = this.getStats.bind(this);
    this.checkAuth = this.checkAuth.bind(this);
    this.getOrders = this.getOrders.bind(this);
  }

  private createOrderSchema: validator.ValidationSchema = {
    products: {
      in: ['body'],
      errorMessage: 'Must be array',
      isArray: true,
    },
    'products.*.uuid': {
      in: ['body'],
      errorMessage: 'Must be uuid',
      isUUID: true,
    },
    'products.*.unit': {
      in: ['body'],
      errorMessage: 'Must be integer',
      isNumeric: true,
    },
    'orderPosition.x': {
      in: ['body'],
      errorMessage: 'Must be integer',
      isNumeric: true,
    },
    'orderPosition.y': {
      in: ['body'],
      errorMessage: 'Must be integer',
      isNumeric: true,
    },
  };

  private createCustomerSchema: validator.ValidationSchema = {
    name: {
      in: ['body'],
      errorMessage: 'Cannot be empty',
      exists: true,
      trim: true,
      escape: true,
    },
    password: {
      in: ['body'],
      errorMessage: 'Cannot be empty and 6 chars minimum',
      trim: true,
      exists: true,
      isLength: {
        options: 6,
      },
    },
  };

  private getProductsSchema: validator.ValidationSchema = {
    zoneColor: {
      in: ['query'],
      errorMessage: 'Must be one of these \'blue\', \'orange\', \'green\', \'yellow\', \'purple\', \'white\', \'brown\', \'red\'',
      optional: true,
      isIn: {
        options: [['blue', 'orange', 'green', 'yellow', 'purple', 'white', 'brown', 'red']],
      },
    },
  };

  private createCustomerToken(req: express.Request, res: express.Response) {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const name = req.body.name;
      const password = req.body.password;

      Customer.findByName(name, (err, customer) => {
        if (customer) {
          Customer.comparePassword(password, customer.password, (error, isMatch) => {
            if (error) {
              this.logger.error(`${error}`);
              res.status(500).json({
                success: false,
                message: 'something went wrong.',
              });
            } else if (isMatch) {
              const cleanCustomer = {
                id: customer._id,
                roles: customer.roles,
              };
              const token = jwt.sign(cleanCustomer, this.config.get('jwt.secret'), {
                expiresIn: this.config.get('jwt.expiration'),
              });

              res.status(200).json({
                token,
              });
            } else {
              res.status(400).json({
                success: false,
                message: 'Wrong credentials provided.',
              });
            }
          });
        } else {
          res.status(400).json({
            success: false,
            message: 'Wrong credentials provided.',
          });
        }
      });
    }
  }

  private createCustomer(req: express.Request, res: express.Response) {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const name = req.body.name;
      const password = req.body.password;

      Customer.findByName(name, (err, user) => {
        if (err) {
          this.logger.error(`${err}`);
          res.status(500).json({
            success: false,
            message: 'something went wrong.',
          });
        } else if (!user) {
          const customer = new Customer({
            name,
            password,
          });

          // @ts-ignore
          Customer.createCustomer(customer, (err2) => {
            if (err2) {
              this.logger.error(err2);
              res.status(500).json({
                success: false,
                message: 'something went wrong.',
              });
            } else {
              res.status(201).send();
            }
          });
        } else {
          res.status(400).json({
            success: false,
            message: 'this name has already been taken.',
          });
        }
      });
    }
  }

  private static async isProductAvailable(uuid: string, unitToRemove: number) {
    const product = await Product.findOne({ uuid });
    if (!product) {
      throw new Error(`Product with uuid:${uuid} could not be found`);
    }
    return (product.unit - unitToRemove) >= 0;
  }

  private async createOrder(req: express.Request, res: express.Response) {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      try {
        const products = req.body.products;
        const orderPosition = req.body.orderPosition;

        const orderProducts: IOrderProduct[] = [];

        const jobProducts = await PromiseBlue.map(products, async (item: IJobProduct) => {
          if (await Routes.isProductAvailable(item.uuid, item.unit)) {
            // Update the product
            const product = await Product.findOne({ uuid: item.uuid }).populate('zone');
            await Product.updateOne({ uuid: item.uuid }, { $set: { unit: (product.unit - item.unit) } });

            delete item.uuid;
            item.product = product.id;
            orderProducts.push(item);

            return {
              uuid: product.uuid,
              zone: {
                uuid: product.zone.uuid,
                color: product.zone.color,
                entries: product.zone.entries,
              },
            };
          }
          throw new Error(`Product uuid: ${item.uuid} not available`);
        });

        const order = new Order({
          orderPosition,
          products: orderProducts,
          user: req.user.id,
          status: 'pending',
        });

        const job: IJob = {
          orderPosition,
          // @ts-ignore
          products: jobProducts,
          orderId: order.id,
          userId: order.user,
          worker: `ROBOT-x${orderPosition.x}-y${orderPosition.y}`,
        };

        await order.save();
        const result = await this.jobManager.createJob(job);

        if (result) {
          res.status(201).send(result);
        } else {
          res.status(400).send('Error creating job');
        }
      } catch (e) {
        this.logger.error(e);
        res.status(500).send(e.message);
      }
    }
  }

  private async getZones(req: express.Request, res: express.Response) {
    try {
      const result = await Zone.find();
      res.status(200).send(result);
    } catch (e) {
      this.logger.error(e.stack);
      res.status(500).send(e.message);
    }
  }

  private async getOrders(req: express.Request, res: express.Response) {
    try {
      const result = await Order.find({ user: req.user.id }).populate('products.product');
      res.status(200).send(result);
    } catch (e) {
      this.logger.error(e.stack);
      res.status(500).send(e.message);
    }
  }

  private async getWorkers(req: express.Request, res: express.Response) {
    try {
      const result = await this.jobManager.getWorkers();
      res.status(200).send(result);
    } catch (e) {
      this.logger.error(e.stack);
      res.status(500).send(e.message);
    }
  }

  private async getStats(req: express.Request, res: express.Response) {
    try {
      const result = await this.jobManager.getStats();
      res.status(200).send(result);
    } catch (e) {
      this.logger.error(e.stack);
      res.status(500).send(e.message);
    }
  }

  private async getProducts(req: express.Request, res: express.Response) {
    try {
      const zoneColorFilter = req.query.zoneColor;
      let results;
      if (zoneColorFilter) {
        const zone = await Zone.findOne({ color: zoneColorFilter });
        results = await Product.find({ zone: zone.id }, 'uuid unit zone').populate('zone', 'uuid color entries').lean();
      } else {
        results = await Product.find(null, 'uuid unit zone').populate('zone', 'uuid color entries').lean();
      }
      if (results) {
        res.status(201).send(results);
      } else {
        this.logger.error('Error on get products .');
        res.status(400).send('Error getting products.');
      }
    } catch (e) {
      this.logger.error(e);
      res.status(500).send(e);
    }
  }

  private checkAuth() {
    return this.passport.authenticate('jwt', { session: false });
  }

  public getRoutes(): express.Router {
    const router = express.Router();
    router.get('/workers', this.getWorkers);
    router.get('/stats', this.checkAuth(), this.getStats);
    router.get('/zones', this.checkAuth(), this.getZones);
    router.get('/orders', this.checkAuth(), this.getOrders);
    router.get('/products', this.checkAuth(), validator.checkSchema(this.getProductsSchema), this.getProducts);
    router.post('/orders', this.checkAuth() , validator.checkSchema(this.createOrderSchema), this.createOrder);
    router.post('/customers/signup', validator.checkSchema(this.createCustomerSchema), this.createCustomer);
    router.post('/customers/token', validator.checkSchema(this.createCustomerSchema), this.createCustomerToken);

    return router;
  }
}

export default Routes;
