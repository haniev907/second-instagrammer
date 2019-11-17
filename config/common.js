const cdxUtil = require('@cdx/util');

const config = {};

config.coldStart = cdxUtil.envFlag('COLD_START');
config.checkQuantityEnabled = cdxUtil.envFlag('CHECK_QUANTITY_ENABLED');
config.metricsPort = (process.env.METRICS_PORT || 9822);

module.exports = config;
