const mongoose = require('mongoose');
const uuid = require('uuid');

const moment = require('moment');

const MongoModelBase = require('./base');

const emptyAvatar = 'https://scontent-lhr3-1.cdninstagram.com/vp/1f43bcfa6c680475953cb3bcd1aca607/5E695BF1/t51.2885-19/44884218_345707102882519_2446069589734326272_n.jpg?_nc_ht=scontent-lhr3-1.cdninstagram.com';

const ongoingСhecks = () => ({
  ban: { $lte: 2 },
});

const paramsValidFollower = (data) => (
  [{
    'observed.status': 'self',
    'observed.formers': {
      $not: {
        $in: [ data.leaderId ],
      },
    },
  }, {
    'observed.status': { $in: [ 'requested', 'followed' ], },
    'observed.lastFormer': data.leaderId,
  }, {
    'observed.formers': { $size: 0 },
  }]
);

class MongoUser extends MongoModelBase {
  constructor(config, connection) {
    super(config, connection);

    this.schema = new mongoose.Schema({
      _id: { type: String, default: uuid.v4 },
      name: { type: String, required: true, index: true, unique: true },
      bot: { type: Boolean, required: true, default: false },
      ban: { type: Number, default: 0 },
      password: { type: String },
      followers: { type: Number, default: 0 },
      subscriptions: { type: Number, default: 0 },
      publications: { type: Number, default: 0 },
      status: { type: String, default: '' },
      private: { type: Boolean, default: false },
      instId: { type: String  },
      preview: { type: String, default: emptyAvatar },
      processed: { type: Boolean, default: false },
      observed: {
        status: { type: String, default: 'self' },
        lastFormer: { type: String, default: 'none' },
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
    return this.Model.find(Object.assign(ongoingСhecks(), query));
  }

  async searchUsers(profileName) {
    return this.Model
      .find({ bot: false, name: profileName }, {
        name: 1,
        preview: 1,
        _id: 0,
      })
      .limit(20)
      .exec();
  }

  async clearLeaderForOldUsers(timestamp) {
    const ttl = moment.utc()
      .subtract(timestamp, 'seconds');

    return this.Model.updateMany({ 
      bot: false,
      'observed.lastFormer': { $ne: 'none' },  
      lastUpdate: { $lte: ttl }
    }, {
      'observed.status': 'self',
    }, { upsert: false })
      .exec();
  }

  async getNewUsers(cursor = 0, limit = 10) {
    return this.Model
      .find({ bot: false, 'observed.formers': { $size: 0 } })
      .skip(cursor)
      .limit(limit);
  }

  async getFollowers(data, cursor = 0, limit = 10) {
    return this.Model
      .find({  
        bot: false, 
        $or: paramsValidFollower({
          leaderId: data.leaderId,
        }),
      })
      .skip(cursor)
      .limit(limit);
  }

  async isValidFollower(leaderId, followerId) {
    const curentFollower = await this.Model.findOne({
      _id: followerId,
      $or: paramsValidFollower({
        leaderId,
      }),
    }).exec();

    return curentFollower !== null;
  }

  async getBuyId(userId) {
    return this.Model.findOne(
      { _id: userId },
    ).exec();
  }

  async getByName(userName) {
    return this.Model.findOne(
      { name: userName },
    ).exec();
  }

  async updateUser(userId, updateOptions) {
    await this.Model.updateOne(
      { _id: userId },
      {  
        ...updateOptions,
        lastUpdate: moment.utc().toDate(),
        processed: true,
        ban: updateOptions.ban || 0,
      },
    ).exec();

    return this.getBuyId(userId);
  }

  async clearingFollowers(leaderId) {
    return this.Model.updateMany(
      { bot: false, 'observed.lastFormer': leaderId, },
      {  
        'observed.status': 'self',
      },
      { upsert: false, }
    ).exec();
  }

  async updateFollowData(followerId, leaderId, status) {
    return this.Model.updateOne(
      { _id: followerId },
      { 
        $push: { 'observed.formers': leaderId },
        $set: {
          'observed.lastFormer': leaderId,
          'observed.status': status,
        },
      },
    );
  }
}

module.exports = MongoUser;
