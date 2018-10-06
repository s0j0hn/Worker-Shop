import { Document, Model, model, Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';
import * as winston from 'winston';
import { IZone } from './ZoneModel';

export interface IProduct extends Document {
  readonly id: string;
  unit?: number;
  uuid?: string;
  zone: IZone;
}

export interface IProductModel {
  createProduct(product: IProduct, callback: () => void): void;
  findById(id: string, callback: (err: Error, product: IProduct) => void): void;
}

const productSchema = new Schema({
  uuid: {
    type: String,
    default: uuid(),
  },
  unit: {
    type: Number,
    default: 10000,
  },
  zone: {
    type: Schema.Types.ObjectId,
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

productSchema.static('createProduct', (order: IProduct, callback: () => void) => {
  const product = new Product(order);
  product.save();
});

productSchema.static('findById', (id: string, callback: () => void) => {
  Product.findById(id, callback).lean();
});

export async function seedProducts(doc, logger: winston.LoggerInstance): Promise<void> {
  async function skipDocument(): Promise<boolean> {
    const existingProduct = await Product.findOne({ uuid: doc.uuid });
    if (!existingProduct) {
      return false;
    }
    await Product.deleteMany({});
    return true;
  }

  async function add(skip): Promise<void> {
    if (!skip) {
      const product = new Product(doc);
      await product.save();
      logger.info(`Database seeding: Product uuid: ${doc.uuid} added successfully.`);
    }
  }

  const skiDoc = await skipDocument();
  await add(skiDoc);
}

export type ProductModel = Model<IProduct> & IProductModel & IProduct;

export const Product: ProductModel = model<IProduct>('Product', productSchema) as ProductModel;
