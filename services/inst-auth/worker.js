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

    const leaderData = await cdx.db.user.getBuyId(leader);
    const followerData = await cdx.db.user.getBuyId(follower);

    console.log('Start queue for users - ', {
      leader,
      follower,
    });

    const client = cdx.stock.api.init(
      { username: leaderData.name, password: leaderData.password, },
    );

    const updateLeader = async (stop = false) => {
      const response = await client.getFullInfo();

      console.log('Update leader info');
      console.log({ response, });

      if (response.status === 'error') return;

      const dbResponse = await cdx.db.user.updateUser(leader, {
        followers: response.edge_followed_by.count,
        subscriptions: response.edge_follow.count,
        status: response.biography,
        private: response.is_private,
        instId: response.id,
      });

      console.log({ dbResponse, });
    };

    if (!leaderData.lastUpdate || moment.utc()
      .subtract(config.constants.ttlForUserUpdate / 1000, 'seconds')
      .isAfter(leaderData.lastUpdate)
    ) {
      updateLeader();
    }

    const updateFollower = async (stop = false) => {
      const response = await client.getFullInfo(followerData.name);

      console.log('Update follower info');
      console.log({ response, });

      if (response.status === 'error') return;

      const dbResponse = await cdx.db.user.updateUser(follower, {
        followers: response.edge_followed_by.count,
        subscriptions: response.edge_follow.count,
        status: response.biography,
        private: response.is_private,
        instId: response.id,
      });

      console.log({ dbResponse, });
    };

    updateFollower();

    await (new Promise(resolve => setTimeout(resolve, 300000)))

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

  // cdx.db.user.createUser({
  //   name: 'prostoy495',
  //   password: 'asdfkk239j&',
  //   bot: true,
  // });

  // cdx.db.user.createUser({
  //   name: '_fa_n_ta_ze_r_',
  // });

  // cdx.db.user.createUser({
  //   name: 'haniev_i',
  // });

  // return false;

  queue.processJob(async () => {
    const bots = await cdx.db.user.getUsers({ bot: true });

    const pairingFn = async (prev, curentBot) => {
      const cursor = await prev;

      const limit = config.constants.limitSubscriptions - curentBot.subscriptions;

      if (limit < 0) return cursor;

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
