"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    products: [
        {
            product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
            unit: Number,
        },
    ],
    orderPosition: {
        x: {
            type: Number,
            required: 'Must have "x" as position.',
        },
        y: {
            type: Number,
            required: 'Must have "y" as position.',
        },
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'failed', 'delivred'],
        required: 'Order must have of one the status: \'pending\', \'processed\', \'failed\', \'delivred\'',
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Customer',
        required: 'Customer id must be provided.',
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
orderSchema.static('createOrder', (order, callback) => {
    const newOrder = new exports.Order(order);
    newOrder.save();
});
orderSchema.static('findById', (id, callback) => {
    exports.Order.findById(id, callback).lean();
});
exports.Order = mongoose_1.model('Order', orderSchema);
