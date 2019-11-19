const cdxUtil = require('@cdx/util');

const MongoConnection = require('./mongo/connection');

const MongoUser = require('./mongo/models/user');
const MongoMedia = require('./mongo/models/media');

class DB {
  constructor(config) {
    this.config = config;

    const mongoConnection = this.config.mongo.enabled
      ? new MongoConnection(this.config.mongo.uri)
      : null;

    const disabledMongoDB = new Proxy({}, {
      get: () => {
        throw new Error('To be able to use the MongoDB class, set MONGO_ENABLED=1');
      },
    });

    const registerModel = (Model, enabled, ...args) => {
      if (!enabled) {
        return disabledMongoDB;
      }

      const model = new Model(...args);

      model.Model.on('index', (err) => {
        if (!err) return;
        logger.error(
          'index',
          { message: `Index error in ${Model.name}`, error: err },
          config.logging.db.mongo,
        );
        // TODO: throw Error(err);
      });

      return model;
    };

    const registerMongoModel = Model => registerModel(
      Model,
      this.config.mongo.enabled, this.config,
      mongoConnection,
    );

    /** @type {MongoUser} */
    this.user = registerMongoModel(MongoUser);
    /** @type {MongoUser} */
    this.media = registerMongoModel(MongoMedia);
  }
}

module.exports = DB;
