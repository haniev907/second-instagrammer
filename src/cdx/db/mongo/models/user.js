const mongoose = require('mongoose');
const uuid = require('uuid');

const MongoModelBase = require('./base');

class MongoUser extends MongoModelBase {
  constructor(config, connection) {
    super(config, connection);

    this.schema = new mongoose.Schema({
      _id: { type: String, default: uuid.v4 },
      name: { type: String, required: true, maxlength: 128 },
      bot: { type: Boolean, required: true, default: false },
      password: { type: String },
      followers: { type: Number },
      subscriptions: { type: Number },
      publications: { type: Number },
      status: { type: String },
      private: { type: Boolean },
      instId: { type: String  },
      observed: {
        status: { type: String },
        lastFormer: { type: String },
        formers: { type: Array, default: [] },
      },
    });

    this.Model = mongoose.model('User', this.schema);
  }

  async createUser(infArray) {
    const doc = new this.Model(infArray);

    return doc.save();
  }

  async getInfo(userId) {
    return this.Model.findOne(
      { _id: userId },
      { firstName: 1, lastName: 1, email: 1 },
    ).exec();
  }
}

module.exports = MongoUser;
