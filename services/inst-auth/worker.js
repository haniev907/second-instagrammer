const moment = require('moment');

const cdxUtil = require('@cdx/util');
const config = require('@cdx/config');

const logger = cdxUtil.logging;

async function instAuthJob() {
  const queue = new cdxUtil.queue.RevivableQueue(
    config,
    config.queues.instAuth.jobs.performance,
  );

  queue.processJob(async (job) => {
    console.log('62');
  }, {
    filterFn: job => true,
    concurrency: 8,
  });

  return queue;
}


async function ensureJobs(ratingQueue) {
  const queue = new cdxUtil.queue.SimpleQueue(
    config,
    config.queues.instAuth.jobs.ensureJobs,
  );

  const repeatOpts = { every: config.constants.mSecFiveMinutes };
  await queue.addRepeatableJob({}, repeatOpts);

  if (config.common.coldStart) await queue.addSimpleJob({});

  queue.processJob(async () => {
    console.log('processJob to ensure');
    // const validKeys = await cdx.db.apikey.getValidKeys();

    // logger.info(
    //   'ensure',
    //   { validKeysAmount: validKeys.length },
    //   config.logging.instAuth.basic,
    // );

    // const baseAssets = ['USD', 'BTC', 'ETH', 'BNB'];

    // const jobs = baseAssets.map(baseAsset => validKeys
    //   .map(
    //     ({ keyId, stock }) => ratingQueue.ensureRevivableJob({
    //       keyId, stock, baseAsset,
    //     }, null, config.constants.mSecOneSecond),
    //   ));

    // const promiseJobs = [].concat(...jobs);

    // return Promise.all(promiseJobs);
  });
}

(async () => {
  const instAuthQueue = await instAuthJob();
  await ensureJobs(instAuthQueue);
})()
  .then(() => logger.info('start', {}, config.logging.instAuth.basic));
