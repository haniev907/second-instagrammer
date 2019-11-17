const cdxUtil = require('@cdx/util');

const config = {};

config.enabled = cdxUtil.envFlag('MONGO_ENABLED') || 1;
config.extMarketParser = cdxUtil.envFlag('EXT_MARKET_PARSER') || 0;

if (config.enabled) {
  config.uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cindx-dev';
  config.mpUri = process.env.MP_MONGO_URI || 'mongodb://localhost:27017/cindx-mp';
}

module.exports = config;
