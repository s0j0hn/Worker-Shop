import * as PromiseBlue from 'bluebird';
import { v4 as uuid } from 'uuid';
import * as winston from 'winston';
import { Product, seedProducts } from '../models/ProductModel';
import { seedZones, Zone } from '../models/ZoneModel';

export async function seedDb(logger: winston.LoggerInstance): Promise<void> {
  logger.debug('Seeding the database ...');
  const zones = [
    {
      uuid: '86deb60d-b57f-4945-8b65-cd636b8d3a13',
      color: 'blue',
      entries: [
        {
          x: 3,
          y: 1,
        },
        {
          x: 1,
          y: 3,
        },
        {
          x: 3,
          y: 5,
        },
        {
          x: 5,
          y: 3,
        },
      ],
    },
    {
      uuid: '86deb60d-b57f-4945-8b65-cd636b8d3a12',
      color: 'yellow',
      entries: [
        {
          x: 3,
          y: 1 + 4 ,
        },
        {
          x: 1,
          y: 3 + 4,
        },
        {
          x: 3,
          y: 5 + 4,
        },
        {
          x: 5,
          y: 3 + 4,
        },
      ],
    },
    {
      uuid: '86deb60d-b57f-4945-8b65-cd636b8d3a11',
      color: 'green',
      entries: [
        {
          x: 3 + 4,
          y: 1,
        },
        {
          x: 1 + 4,
          y: 3,
        },
        {
          x: 3 + 4,
          y: 5,
        },
        {
          x: 5 + 4,
          y: 3,
        },
      ],
    },
    {
      uuid: '86deb60d-b57f-4945-8b65-cd636b8d3a10',
      color: 'red',
      entries: [
        {
          x: 3 + 8 ,
          y: 1 + 8 ,
        },
        {
          x: 1 + 8 ,
          y: 3 + 8 ,
        },
        {
          x: 3 + 8 ,
          y: 5 + 8 ,
        },
        {
          x: 5 + 8 ,
          y: 3 + 8 ,
        },
      ],
    },
  ];

  try {
    await PromiseBlue.map(zones, async (itemZone) => {
      const zone = await new Zone(itemZone);
      await seedZones(zone, logger);

      const product = await new Product();
      product.zone = zone.id;
      product.uuid = uuid();
      await seedProducts(product, logger);
    });
  } catch (e) {
    logger.error(e);
  }
}
