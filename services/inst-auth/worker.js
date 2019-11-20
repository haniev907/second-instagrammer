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
        duration: config.constants.mSecFiveSeconds,
      },
    },
  );

  queue.processJob(async (job) => {
    const { leader, follower } = job.data;

    const leaderData = await cdx.db.user.getBuyId(leader);
    const followerData = await cdx.db.user.getBuyId(follower);

    logger.info(
      'Start queue handle for - ',
      { follower: followerData.name, leader: leaderData.name, },
      config.logging.instAuth.process,
    );

    /* Initialization instagram bot */
    const client = cdx.stock.api.init(
      { username: leaderData.name, password: leaderData.password, },
    );

    /* Update leader basic information after the expiration */
    const updateLeader = async (stop = false) => {
      const response = await client.getFullInfo();

      logger.info(
        'Func #1 updateLeader',
        { response, },
        config.logging.instAuth.process,
      );

      if (response === 'error') return;

      const dbResponse = await cdx.db.user.updateUser(leader, {
        followers: response.edge_followed_by.count,
        subscriptions: response.edge_follow.count,
        status: response.biography,
        private: response.is_private,
        instId: response.id,
      });
    };

    /* Method for authentication verification */
    const authPoint = async () => {
      return await client.getActivity();
    };

    /* Function for mapping and adding follower posts */
    const addMediaFollower = async (userId, mediaArray) => {
      const allResponses = mediaArray.reduce(async (prev, { node }) => {
        await prev;

        return cdx.db.media.addMedia({
          userId,
          url: node.display_url,
          is_video: node.is_video,
          instId: node.id,
        });
      }, Promise.resolve());

      return Promise.all(allResponses);
    };

    /* Update basic information follower and follow login */
    const updateFollower = async (stop = false) => {
      const response = await client.getFullInfo(followerData.name);

      logger.info(
        'Func #1 updateFollower',
        { response, },
        config.logging.instAuth.process,
      );

      if (response === 'error') return;

      const followStatus = response.followed_by_viewer ? 'followed' :
        response.requested_by_viewer ? 'requested' : 'self';

      /* Subscription required */
      const noNeedFollow = !response.is_private
        || response.requested_by_viewer || response.followed_by_viewer;

      /* Saving basic information */
      const dbResponse = await cdx.db.user.updateUser(follower, {
        followers: response.edge_followed_by.count,
        subscriptions: response.edge_follow.count,
        status: response.biography,
        private: response.is_private,
        publications: response.edge_owner_to_timeline_media.count,
        instId: response.id,
        preview: response.profile_pic_url,
      });

      /* Change follow status if now incorect */
      if (followerData.observed.status !== followStatus) {
        const followUpdateStatus = await cdx.db.user.updateFollowData(follower, leader, followStatus);

        logger.info(
          'Now status follow incorect, it did changed',
          { followUpdateStatus, },
          config.logging.instAuth.process,
        );

        return;
      }

      /* Adding posts if now followed */
      if (response.followed_by_viewer) {
        const edges = response.edge_owner_to_timeline_media.edges;
        
        logger.info(
          'Func #2 updateFollower, adding posts',
          { countPosts: edges.length, },
          config.logging.instAuth.process,
        );

        await addMediaFollower(
          follower,
          edges,
        );
      }

      logger.info(
        'Log noNeedFollow',
        { noNeedFollow, },
        config.logging.instAuth.process,
      );

      /* Skip if public account or request sended */
      if (noNeedFollow) return;

      try {
        const followResponse = await client.follow({ userId: response.id });

        logger.info(
          'Sended follower request',
          { followResponse, },
          config.logging.instAuth.process,
        );

        if (followResponse.status === 'ok')
          cdx.db.user.updateFollowData(follower, leader, 'requested');
      } catch (error) {
        logger.info(
          'Error for send follow',
          { error, },
          config.logging.instAuth.process,
        );
      }
    };

    /* Check time ttl for leader and update */
    if (!leaderData.lastUpdate || moment.utc()
      .subtract(config.constants.ttlForUserUpdate / 1000, 'seconds')
      .isAfter(leaderData.lastUpdate)
    ) {
      await updateLeader();
    } else {
      const isAuthorized = await authPoint();

      if (isAuthorized === 'error') return;
    }

    /* Check time ttl for follower and update */
    if (!followerData.lastUpdate || moment.utc()
      .subtract(config.constants.ttlForUserUpdate / 1000, 'seconds')
      .isAfter(followerData.lastUpdate)
    ) {
      await updateFollower();
    }

    // await (new Promise(resolve => setTimeout(resolve, 300000)));
    return cdxUtil.queue.RevivableQueue.removeJob();
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

  const repeatOpts = { every: config.constants.mSecThirtySeconds };
  await queue.addRepeatableJob({}, repeatOpts);

  if (config.common.coldStart) await queue.addSimpleJob({});

  // cdx.db.user.createUser({
  //   name: 'prostoy495',
  //   password: 'asdfkk239j&',
  //   bot: true,
  // });

  // cdx.db.user.createUser({
  //   name: 'haniev_i',
  //   password: 'asdfkk239j&',
  //   bot: true,
  // });

  // cdx.db.user.createUser({
  //   name: '_fa_n_ta_ze_r_',
  // });

  // return false;

  queue.processJob(async () => {
    const bots = await cdx.db.user.getUsers({ bot: true });

    logger.info(
      'Bots started watings',
      { countBots: bots.length, },
      config.logging.instAuth.process,
    );

    const pairingFn = async (prev, curentBot) => {
      const cursor = await prev;

      const limit = config.constants.limitSubscriptions - curentBot.subscriptions;

      if (limit < 0) return cursor;

      const watchFollowers = await cdx.db.user.getFollowers({
        leaderId: curentBot._id,
      }, cursor, limit);

      watchFollowers.map((curentUser) => 
        instAuthQueue.ensureRevivableJob({
          follower: curentUser.id,
          leader: curentBot.id,
        })
      );

      return cursor + watchFollowers.length;
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
