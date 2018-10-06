"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const PromiseBlue = require("bluebird");
const uuid_1 = require("uuid");
const ProductModel_1 = require("../models/ProductModel");
const ZoneModel_1 = require("../models/ZoneModel");
function seedDb(logger) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                        y: 1 + 4,
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
                        x: 3 + 8,
                        y: 1 + 8,
                    },
                    {
                        x: 1 + 8,
                        y: 3 + 8,
                    },
                    {
                        x: 3 + 8,
                        y: 5 + 8,
                    },
                    {
                        x: 5 + 8,
                        y: 3 + 8,
                    },
                ],
            },
        ];
        try {
            yield PromiseBlue.map(zones, (itemZone) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const zone = yield new ZoneModel_1.Zone(itemZone);
                yield ZoneModel_1.seedZones(zone, logger);
                const product = yield new ProductModel_1.Product();
                product.zone = zone.id;
                product.uuid = uuid_1.v4();
                yield ProductModel_1.seedProducts(product, logger);
            }));
        }
        catch (e) {
            logger.error(e);
        }
    });
}
exports.seedDb = seedDb;
