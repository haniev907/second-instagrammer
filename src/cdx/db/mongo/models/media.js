const mongoose = require('mongoose');
const uuid = require('uuid');

const moment = require('moment');

const MongoModelBase = require('./base');

class MongoMedia extends MongoModelBase {
  constructor(config, connection) {
    super(config, connection);

    this.schema = new mongoose.Schema({
      _id: { type: String, default: uuid.v4 },
      url: { type: String, required: true },
      userId: { type: String, ref: 'User', required: true },
      instId: { type: String, index: true, unique: true, required: true },
      is_video: { type: Boolean, default: false, required: true },
    });

    this.Model = mongoose.model('Media', this.schema);
  }

  async addMedia(infArray) {
    return this.Model.updateMany(
      { instId: infArray.instId }, 
      { ...infArray, },
      { upsert: true },
    ).exec();
  }

  async getByUserId(userId) {
    return this.Model.find({
      userId, 
    }).exec();
  }
}

module.exports = MongoMedia;
