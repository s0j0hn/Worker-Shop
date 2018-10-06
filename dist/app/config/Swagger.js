"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const extendify = require("extendify");
const fs = require("fs");
const glob = require("glob");
const YAML = require("js-yaml");
const swaggerUi = require("swagger-ui-express");
class Swagger {
    constructor(app) {
        this.app = app;
    }
    loadSwagger() {
        // Merge files.
        glob('./doc/**/*.yml', (err, files) => {
            if (!err) {
                try {
                    const contents = files.map(file => YAML.safeLoad(fs.readFileSync(file).toString()));
                    const extend = extendify({
                        inPlace: true,
                        isDeep: true,
                    });
                    const merged = contents.reduce(extend);
                    fs.writeFile('./public/swagger.yml', YAML.safeDump(merged), (error) => {
                        if (error) {
                            throw error;
                        }
                    });
                }
                catch (e) {
                    throw new Error(e);
                }
            }
            else {
                throw err;
            }
        });
        this.app.use('/docs/swagger.yml', express.static('./public/swagger.yml'));
        this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: '/docs/swagger.yml' }));
    }
}
exports.default = Swagger;
