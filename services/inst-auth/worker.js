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

    const next = async () => {
      await cdxUtil.sleep(5000);
      return cdxUtil.queue.RevivableQueue.removeJob();
    };

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

      return allResponses;
    };

    /* Update basic information follower and follow login */
    const updateFollower = async (stop = false) => {
      const response = await client.getFullInfo(followerData.name);

      logger.info(
        'Func #1 updateFollower',
        { response, },
        config.logging.instAuth.process,
      );

      if (response === 'error') return 'error';

      const followStatus = response.followed_by_viewer ? 'followed' :
        response.requested_by_viewer ? 'requested' : 'self';

      /* Subscription required */
      const isPublic = !response.is_private;
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
      if (response.followed_by_viewer || isPublic) {
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

        if (followResponse.status === 'ok') {
          cdx.db.user.updateFollowData(follower, leader, 'requested');
        }
      } catch (error) {
        logger.info(
          'Error for send follow',
          { error, },
          config.logging.instAuth.process,
        );

        return 'error';
      }
    };

    const invalidLeader = async () => {
      logger.info(
        `Bot ${leaderData.name} is error auth`,
        {},
        config.logging.instAuth.process,
      );

      const banIncrement = (leaderData.ban || 0) + 1;
      const dbResponse = await cdx.db.user.updateUser(leader, {
        ban: banIncrement,
      });

      /* Clear all subscribers from binding */
      if (banIncrement === config.constants.amountForBanLeader) {
        await cdx.db.user.clearingFollowers(leader);
      }

      logger.info(
        `Raised ban increment, ban = ${banIncrement}`,
        {},
        config.logging.instAuth.process,
      );
    };

    const returnOfInvalid = async () => {
      await invalidLeader();
      return await next();
    };

    /* Check time ttl for leader and update */
    if (!leaderData.lastUpdate || moment.utc()
      .subtract(config.constants.ttlForUserUpdate / 1000, 'seconds')
      .isAfter(leaderData.lastUpdate)
    ) {
      const resultUpdateLeader = await updateLeader();

      if (resultUpdateLeader === 'error') return returnOfInvalid();
    } else {
      const isAuthorized = await authPoint();

      /* If the bot is broken */
      if (isAuthorized === 'error') return returnOfInvalid();
    }

    /* Check time ttl for follower and update */
    if (!followerData.lastUpdate || moment.utc()
      .subtract(config.constants.ttlForUserUpdate / 1000, 'seconds')
      .isAfter(followerData.lastUpdate)
    ) {
      await updateFollower();
    }

    return await next();
  }, {
    concurrency: 1,
    filterFn: async (job) => await cdx.db.user.isValidFollower(job.data.leader, job.data.follower),
  });

  return queue;
}

async function ensureJobs(instAuthQueue) {
  const queue = new cdxUtil.queue.SimpleQueue(
    config,
    config.queues.instAuth.jobs.ensureJobs,
  );

  const repeatOpts = { every: config.constants.mSecOneMinute };
  await queue.addRepeatableJob({}, repeatOpts);

  if (config.common.coldStart) await queue.addSimpleJob({});

  queue.processJob(async () => {
    const validBots = await cdx.db.user.getUsers({ bot: true }); 
    const invalidBots = await cdx.db.user.getUsers({ bot: true, ban: config.constants.amountForBanLeader }); 

    logger.info(
      'Bots started wathing',
      { 
        countValidBots: validBots.length, 
        countInvalidBots: invalidBots.length,
      },
      config.logging.instAuth.process,
    );

    const validPairingFn = async (prev, curentBot) => {
      const cursor = await prev;

      const limit = config.constants.limitSubscriptions - curentBot.subscriptions;

      if (limit < 0) return cursor;

      const watchFollowers = await cdx.db.user.getFollowers({
        leaderId: curentBot._id,
      }, cursor, limit);

      const strFollowersName = (watchFollowers.map((curentFollower) => curentFollower.name)
        || []).join(', ');

      logger.info(
        `Bot ${curentBot.name} is start watching ${watchFollowers.length} followers: ${strFollowersName}`,
        {},
        config.logging.instAuth.process,
      );

      watchFollowers.map((curentUser) => 
        instAuthQueue.ensureRevivableJob({
          follower: curentUser.id,
          leader: curentBot.id,
        })
      );

      return cursor + watchFollowers.length;
    };

    const invalidLeaderClearing = async (prev, curentBot) => {
      await prev;

      logger.info(
        `Invalid bot ${curentBot.name} is start clearing followers`,
        {},
        config.logging.instAuth.process,
      );

      const dbResponse = await cdx.db.user.clearingFollowers(curentBot._id);

      logger.info(
        `Crearing db response`,
        { dbResponse },
        config.logging.instAuth.process,
      );

      return dbResponse;
    };

    const ancientUsersClearing = async (prev, curentUser) => {
      const dbResponse = await cdx.db.user.clearLeaderForOldUsers(config.constants.ttlForReapUser);

      logger.info(
        'Ancient users',
        { dbResponse },
        config.logging.instAuth.process,
      );
    };

    const pairingJobs = validBots.reduce(validPairingFn, 0);
    const clearingJobs = invalidBots.reduce(invalidLeaderClearing, 0);

    // const promiseJobs = [].concat(...jobs);
    // return Promise.all(promiseJobs);
  });
}

(async () => {
  const instAuthQueue = await instAuthJob();
  await ensureJobs(instAuthQueue);
})()
  .then(() => logger.info('start', {}, config.logging.instAuth.basic));
