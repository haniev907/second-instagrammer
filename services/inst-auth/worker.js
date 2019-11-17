const moment = require('moment');

const cdxUtil = require('@cdx/util');
const config = require('@cdx/config');
const cdx = require('@cdx/core')(config);

const logger = cdxUtil.logging;

async function instAuthJob() {
  const queue = new cdxUtil.queue.RevivableQueue(
    config,
    config.queues.instAuth.jobs.performance,
    {
      limiter: {
        max: 1,
        duration: config.constants.mSecOneSecond,
      },
    },
  );

  queue.processJob(async (job) => {
    const { leader, follower } = job.data;

    // return cdxUtil.queue.RevivableQueue.removeJob();
  }, {
    concurrency: 1,
  });

  return queue;
}


async function ensureJobs(instAuthQueue) {
  const queue = new cdxUtil.queue.SimpleQueue(
    config,
    config.queues.instAuth.jobs.ensureJobs,
  );

  const repeatOpts = { every: config.constants.mSecFiveMinutes };
  await queue.addRepeatableJob({}, repeatOpts);

  if (config.common.coldStart) await queue.addSimpleJob({});

  queue.processJob(async () => {
    const bots = await cdx.db.user.getUsers({ bot: true });

    const pairingFn = async (prev, curentBot) => {
      const cursor = await prev;

      const limit = config.constants.limitSubscriptions - curentBot.subscriptions;
      const newUsers = await cdx.db.user.getNewUsers(cursor, limit); 

      newUsers.map((curentUser) => 
        instAuthQueue.ensureRevivableJob({
          follower: curentUser.id,
          leader: curentBot.id,
        })
      );

      return cursor + limit;
    };

    const jobs = bots.reduce(pairingFn, 0);

    // const promiseJobs = [].concat(...jobs);
    // return Promise.all(promiseJobs);
  });
}

(async () => {
  const instAuthQueue = await instAuthJob();
  await ensureJobs(instAuthQueue);
})()
  .then(() => logger.info('start', {}, config.logging.instAuth.basic));
