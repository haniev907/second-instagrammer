const mongoose = require('mongoose');
const uuid = require('uuid');

const moment = require('moment');

const MongoModelBase = require('./base');

class MongoUser extends MongoModelBase {
  constructor(config, connection) {
    super(config, connection);

    this.schema = new mongoose.Schema({
      _id: { type: String, default: uuid.v4 },
      name: { type: String, required: true, index: true, unique: true },
      bot: { type: Boolean, required: true, default: false },
      password: { type: String },
      followers: { type: Number },
      subscriptions: { type: Number, default: 0 },
      publications: { type: Number },
      status: { type: String },
      private: { type: Boolean },
      instId: { type: String  },
      observed: {
        status: { type: String },
        lastFormer: { type: String },
        formers: { type: Array, default: [] },
      },
      lastUpdate: { type: Date },
    });

    this.Model = mongoose.model('User', this.schema);
  }

  async createUser(infArray) {
    const doc = new this.Model(infArray);

    return doc.save();
  }

  async getUsers(query = {}) {
    return this.Model.find(query);
  }

  async getNewUsers(cursor = 0, limit = 10) {
    return this.Model
      .find({ bot: false, 'observed.formers': { $size: 0 } })
      .skip(cursor)
      .limit(limit);
  }

  async getBuyId(userId) {
    return this.Model.findOne(
      { _id: userId },
    ).exec();
  }
}

module.exports = MongoUser;
