"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const PromiseBlue = require("bluebird");
const express = require("express");
const validator = require("express-validator/check");
const jwt = require("jsonwebtoken");
const CustomerModel_1 = require("../models/CustomerModel");
const OrderModel_1 = require("../models/OrderModel");
const ProductModel_1 = require("../models/ProductModel");
const ZoneModel_1 = require("../models/ZoneModel");
class Routes {
    constructor(logger, config, jobManager, passport) {
        this.createOrderSchema = {
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
        this.createCustomerSchema = {
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
        this.getProductsSchema = {
            zoneColor: {
                in: ['query'],
                errorMessage: 'Must be one of these \'blue\', \'orange\', \'green\', \'yellow\', \'purple\', \'white\', \'brown\', \'red\'',
                optional: true,
                isIn: {
                    options: [['blue', 'orange', 'green', 'yellow', 'purple', 'white', 'brown', 'red']],
                },
            },
        };
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
    createCustomerToken(req, res) {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
        }
        else {
            const name = req.body.name;
            const password = req.body.password;
            CustomerModel_1.Customer.findByName(name, (err, customer) => {
                if (customer) {
                    CustomerModel_1.Customer.comparePassword(password, customer.password, (error, isMatch) => {
                        if (error) {
                            this.logger.error(`${error}`);
                            res.status(500).json({
                                success: false,
                                message: 'something went wrong.',
                            });
                        }
                        else if (isMatch) {
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
                        }
                        else {
                            res.status(400).json({
                                success: false,
                                message: 'Wrong credentials provided.',
                            });
                        }
                    });
                }
                else {
                    res.status(400).json({
                        success: false,
                        message: 'Wrong credentials provided.',
                    });
                }
            });
        }
    }
    createCustomer(req, res) {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
        }
        else {
            const name = req.body.name;
            const password = req.body.password;
            CustomerModel_1.Customer.findByName(name, (err, user) => {
                if (err) {
                    this.logger.error(`${err}`);
                    res.status(500).json({
                        success: false,
                        message: 'something went wrong.',
                    });
                }
                else if (!user) {
                    const customer = new CustomerModel_1.Customer({
                        name,
                        password,
                    });
                    // @ts-ignore
                    CustomerModel_1.Customer.createCustomer(customer, (err2) => {
                        if (err2) {
                            this.logger.error(err2);
                            res.status(500).json({
                                success: false,
                                message: 'something went wrong.',
                            });
                        }
                        else {
                            res.status(201).send();
                        }
                    });
                }
                else {
                    res.status(400).json({
                        success: false,
                        message: 'this name has already been taken.',
                    });
                }
            });
        }
    }
    static isProductAvailable(uuid, unitToRemove) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const product = yield ProductModel_1.Product.findOne({ uuid });
            if (!product) {
                throw new Error(`Product with uuid:${uuid} could not be found`);
            }
            return (product.unit - unitToRemove) >= 0;
        });
    }
    createOrder(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const errors = validator.validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
            }
            else {
                try {
                    const products = req.body.products;
                    const orderPosition = req.body.orderPosition;
                    const orderProducts = [];
                    const jobProducts = yield PromiseBlue.map(products, (item) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        if (yield Routes.isProductAvailable(item.uuid, item.unit)) {
                            // Update the product
                            const product = yield ProductModel_1.Product.findOne({ uuid: item.uuid }).populate('zone');
                            yield ProductModel_1.Product.updateOne({ uuid: item.uuid }, { $set: { unit: (product.unit - item.unit) } });
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
                    }));
                    const order = new OrderModel_1.Order({
                        orderPosition,
                        products: orderProducts,
                        user: req.user.id,
                        status: 'pending',
                    });
                    const job = {
                        orderPosition,
                        // @ts-ignore
                        products: jobProducts,
                        orderId: order.id,
                        userId: order.user,
                        worker: `ROBOT-x${orderPosition.x}-y${orderPosition.y}`,
                    };
                    yield order.save();
                    const result = yield this.jobManager.createJob(job);
                    if (result) {
                        res.status(201).send(result);
                    }
                    else {
                        res.status(400).send('Error creating job');
                    }
                }
                catch (e) {
                    this.logger.error(e);
                    res.status(500).send(e.message);
                }
            }
        });
    }
    getZones(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield ZoneModel_1.Zone.find();
                res.status(200).send(result);
            }
            catch (e) {
                this.logger.error(e.stack);
                res.status(500).send(e.message);
            }
        });
    }
    getOrders(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield OrderModel_1.Order.find({ user: req.user.id }).populate('products.product');
                res.status(200).send(result);
            }
            catch (e) {
                this.logger.error(e.stack);
                res.status(500).send(e.message);
            }
        });
    }
    getWorkers(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.jobManager.getWorkers();
                res.status(200).send(result);
            }
            catch (e) {
                this.logger.error(e.stack);
                res.status(500).send(e.message);
            }
        });
    }
    getStats(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.jobManager.getStats();
                res.status(200).send(result);
            }
            catch (e) {
                this.logger.error(e.stack);
                res.status(500).send(e.message);
            }
        });
    }
    getProducts(req, res) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const zoneColorFilter = req.query.zoneColor;
                let results;
                if (zoneColorFilter) {
                    const zone = yield ZoneModel_1.Zone.findOne({ color: zoneColorFilter });
                    results = yield ProductModel_1.Product.find({ zone: zone.id }, 'uuid unit zone').populate('zone', 'uuid color entries').lean();
                }
                else {
                    results = yield ProductModel_1.Product.find(null, 'uuid unit zone').populate('zone', 'uuid color entries').lean();
                }
                if (results) {
                    res.status(201).send(results);
                }
                else {
                    this.logger.error('Error on get products .');
                    res.status(400).send('Error getting products.');
                }
            }
            catch (e) {
                this.logger.error(e);
                res.status(500).send(e);
            }
        });
    }
    checkAuth() {
        return this.passport.authenticate('jwt', { session: false });
    }
    getRoutes() {
        const router = express.Router();
        router.get('/workers', this.getWorkers);
        router.get('/stats', this.checkAuth(), this.getStats);
        router.get('/zones', this.checkAuth(), this.getZones);
        router.get('/orders', this.checkAuth(), this.getOrders);
        router.get('/products', this.checkAuth(), validator.checkSchema(this.getProductsSchema), this.getProducts);
        router.post('/orders', this.checkAuth(), validator.checkSchema(this.createOrderSchema), this.createOrder);
        router.post('/customers/signup', validator.checkSchema(this.createCustomerSchema), this.createCustomer);
        router.post('/customers/token', validator.checkSchema(this.createCustomerSchema), this.createCustomerToken);
        return router;
    }
}
exports.default = Routes;
