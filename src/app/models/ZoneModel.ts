import { Document, Model, model, Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';
import * as winston from 'winston';

export interface IEntry {
  x: number;
  y: number;
}

export interface IZone extends Document {
  entries: IEntry[];
  uuid?: string;
  color: 'blue' | 'orange' | 'green' | 'yellow' | 'purple' | 'white' | 'brown' | 'red';
}

export interface IZoneModel {
  findById(id: string, callback: (err: Error, product: IZone) => void): void;
}

const zoneSchema = new Schema({
  uuid: {
    type: String,
    default: uuid(),
  },
  color: {
    type: String,
    enum: ['blue', 'orange', 'green', 'yellow', 'purple', 'white', 'brown', 'red'],
    required: 'Color must be one of \'blue\', \'orange\', \'green\', \'yellow\', \'purple\', \'white\', \'brown\', \'red\'',
  },
  entries: [
    {
      x: {
        type: Number,
        required: 'Must have "x" as position.',
      },
      y: {
        type: Number,
        required: 'Must have "y" as position.',
      },
    },
  ],
  createAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

zoneSchema.static('findById', (id: string, callback: () => void) => {
  Zone.findById(id, callback).lean();
});

export async function seedZones(doc, logger: winston.LoggerInstance): Promise<void> {

  async function skipDocument(): Promise<boolean> {
    const existingZone = await Zone.findOne({ uuid: doc.uuid });
    if (!existingZone) {
      return false;
    }

    await Zone.deleteMany({});
    return true;
  }

  async function add(ski: boolean): Promise<void> {
    if (!ski) {
      const zone = new Zone(doc);
      await zone.save();
      logger.info(`Database seeding: Zone uuid: ${doc.uuid} and entries : ${doc.entries} added successfully.`);
    }
  }

  const skip = await skipDocument();
  await add(skip);
}

export type ZoneModel = Model<IZone> & IZoneModel & IZone;

export const Zone: ZoneModel = model<IZone>('Zone', zoneSchema) as ZoneModel;
