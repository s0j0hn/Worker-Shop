import { Document, Model, model, Schema } from 'mongoose';
import { IEntry } from './ZoneModel';

export interface IOrderProduct {
  product?: string;
  unit: number;
  uuid: string;
}

export interface IOrder extends Document {
  user: string;
  products: IOrderProduct[];
  orderPosition: IEntry;
  status: 'pending' | 'delivred' | 'failed' | 'processing';
}

export interface IOrderModel {
  createOrder(order: IOrder, callback: () => void): void;
  findById(id: string, callback: (err: Error, order: IOrder) => void): void;
}

const orderSchema = new Schema({
  products: [
    {
      product: { type: Schema.Types.ObjectId, ref: 'Product' },
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
    type: Schema.Types.ObjectId,
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

orderSchema.static('createOrder', (order: IOrder, callback: () => void) => {
  const newOrder = new Order(order);
  newOrder.save();
});

orderSchema.static('findById', (id: string, callback: () => void) => {
  Order.findById(id, callback).lean();
});

export type OrderModel = Model<IOrder> & IOrderModel & IOrder;

export const Order: OrderModel = model<IOrder>('Order', orderSchema) as OrderModel;
