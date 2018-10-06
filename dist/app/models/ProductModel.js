"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const productSchema = new mongoose_1.Schema({
    uuid: {
        type: String,
        default: uuid_1.v4(),
    },
    unit: {
        type: Number,
        default: 10000,
    },
    zone: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Zone',
        required: 'Must have a zone id.',
    },
    createAt: {
        type: Date,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
        default: Date.now(),
    },
});
productSchema.static('createProduct', (order, callback) => {
    const product = new exports.Product(order);
    product.save();
});
productSchema.static('findById', (id, callback) => {
    exports.Product.findById(id, callback).lean();
});
function seedProducts(doc, logger) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        function skipDocument() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const existingProduct = yield exports.Product.findOne({ uuid: doc.uuid });
                if (!existingProduct) {
                    return false;
                }
                yield exports.Product.deleteMany({});
                return true;
            });
        }
        function add(skip) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (!skip) {
                    const product = new exports.Product(doc);
                    yield product.save();
                    logger.info(`Database seeding: Product uuid: ${doc.uuid} added successfully.`);
                }
            });
        }
        const skiDoc = yield skipDocument();
        yield add(skiDoc);
    });
}
exports.seedProducts = seedProducts;
exports.Product = mongoose_1.model('Product', productSchema);
