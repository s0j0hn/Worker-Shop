import * as convict from 'convict';

const config = convict({
  // Env.
  env: {
    app: {
      default: 'development',
      doc: 'The application deployment environment.',
      env: 'APP_ENV',
      format: ['development', 'stage', 'production'],
    },
    node: {
      default: 'development',
      doc: 'The application Node environment.',
      env: 'NODE_ENV',
      format: ['development', 'stage', 'production'],
    },
  },

  seed: {
    default: 'false',
    doc: 'Seed the database or not',
    env: 'APP_SEED',
    format: 'Boolean',
  },

  // App Port.
  port: {
    arg: 'port',
    default: 8080,
    doc: 'The port to bind.',
    env: 'PORT',
    format: 'port',
  },

  // Logs.
  logs: {
    app: {
      default: 'silly',
      doc: 'Application logs level.',
      env: 'APP_LOG_LEVEL',
      format: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
    },
    http: {
      default: 'silly',
      doc: 'Http log level to use for logging http requests.',
      env: 'HTTP_LOG_LEVEL',
      format: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
    },
  },

  jwt: {
    secret:{
      doc: 'JWT secret key for token',
      format: 'String',
      default: 'SDFdsg454sDFze56s57vxZER5s6df55',
      env: 'JWT_SECRET',
    },
    expiration: {
      doc: 'Expiration time of token',
      format: 'Number',
      default: '604800', // 1 Week
      env: 'JWT_EXPIRATION',
    },
  },

  mongodb: {
    uri: {
      doc: 'URI of mongodb server.',
      format: 'String',
      default: 'mongodb://127.0.0.1/resit',
      env: 'MONGODB_URI',
    },
  },

  redis: {
    host: {
      doc: 'Domain or ip address of redis server',
      format: 'String',
      default: 'localhost',
      env: 'REDIS_HOST',
    },
    port: {
      doc: 'Port of edis server',
      format: 'Number',
      default: 6379,
      env: 'REDIS_PORT',
    },
  },

  robot: {
    position:{
      x:{
        format: 'Number',
        default: 0,
        env: 'ROBOT_POSITION_X',
      },
      y: {
        format: 'Number',
        default: 0,
        env: 'ROBOT_POSITION_Y',
      },
    },
  },

});

export default config;
