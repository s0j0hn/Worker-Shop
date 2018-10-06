"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const zoneSchema = new mongoose_1.Schema({
    uuid: {
        type: String,
        default: uuid_1.v4(),
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
zoneSchema.static('findById', (id, callback) => {
    exports.Zone.findById(id, callback).lean();
});
function seedZones(doc, logger) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        function skipDocument() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const existingZone = yield exports.Zone.findOne({ uuid: doc.uuid });
                if (!existingZone) {
                    return false;
                }
                yield exports.Zone.deleteMany({});
                return true;
            });
        }
        function add(ski) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (!ski) {
                    const zone = new exports.Zone(doc);
                    yield zone.save();
                    logger.info(`Database seeding: Zone uuid: ${doc.uuid} and entries : ${doc.entries} added successfully.`);
                }
            });
        }
        const skip = yield skipDocument();
        yield add(skip);
    });
}
exports.seedZones = seedZones;
exports.Zone = mongoose_1.model('Zone', zoneSchema);
