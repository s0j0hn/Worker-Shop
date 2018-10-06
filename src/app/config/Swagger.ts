import * as express from 'express';
import * as extendify from 'extendify';
import * as fs from 'fs';
import * as glob from 'glob';
import * as YAML from 'js-yaml';
import * as swaggerUi from 'swagger-ui-express';

class Swagger {
  private app: express.Application;

  constructor(app: express.Application) {
    this.app = app;
  }

  public loadSwagger(): void {
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
        } catch (e) {
          throw new Error(e);
        }
      } else {
        throw err;
      }
    });

    this.app.use('/docs/swagger.yml', express.static('./public/swagger.yml'));
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: '/docs/swagger.yml' }));
  }
}

export default Swagger;
