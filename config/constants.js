const moment = require('moment');

const cdxUtil = require('@cdx/util');

const config = {};

config.secOneMonth = 30 * 24 * 60 * 60;
config.secOneHour = 60 * 60;
config.secThreeMinutes = 60 * 60;

config.mSecOneSecond = 1000;
config.mSecFiveSeconds = 5 * 1000;
config.mSecOneHour = 60 * 60 * 1000;
config.mSecOneMinute = 60 * 1000;
config.mSecThirtySeconds = 30 * 1000;
config.mSecSixHours = 6 * 60 * 60 * 1000;
config.mSecTenMinutes = 10 * 60 * 1000;
config.mSecFiveMinutes = 5 * 60 * 1000;
config.mSecTenSeconds = 10 * 1000;
config.mSecThreeSeconds = 3 * 1000;
config.mSecOneSecond = 1000;
config.mSecThirtyMinutes = 30 * 60 * 1000;
config.mSecOneDay = 24 * config.mSecOneHour;
config.mSecOneWeek = 7 * config.mSecOneDay;
config.mSecOneMonth = 30 * config.mSecOneDay;

config.minTimestamp = Date.UTC(1970, 0, 1);
config.dataCollectingStart = moment.utc()
  .subtract(1, 'year')
  .startOf('day');

config.ttlForUserUpdate = config.mSecOneMinute;

config.limitSubscriptions = 200;

module.exports = config;
