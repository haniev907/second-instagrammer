const config = {};

const DELIM = '::';
const SERVICE = 'svc';
const JOB = 'job';
const EVENT = 'ev';

const buildQueueName = (...path) => path.join(DELIM);

const marketParser = buildQueueName(SERVICE, 'market-parser');
const userListener = buildQueueName(
  SERVICE, 'user', 'listener',
  process.env.USER_LISTENER_GROUP || '0',
);
const balanceUpdate = buildQueueName(SERVICE, 'user', 'balance');
const keysValidation = buildQueueName(SERVICE, 'keys-validation');
const transfersFetch = buildQueueName(SERVICE, 'transfers-fetch');
const stockPairsFetcher = buildQueueName(SERVICE, 'pairs-fetch');
const ticksFetcher = buildQueueName(SERVICE, 'ticks-fetcher');
const currencyConverter = buildQueueName(SERVICE, 'currency-converter');
const ratingCalculator = buildQueueName(SERVICE, 'rating-calculator');
const following = buildQueueName(SERVICE, 'following');
const aggOHLC = buildQueueName(SERVICE, 'agg-ohlc');
const keyTrades = buildQueueName(SERVICE, 'key-trades');
const rating = buildQueueName(SERVICE, 'rating');
const lessRating = buildQueueName(SERVICE, 'less-rating');
const ordersPing = buildQueueName(SERVICE, 'ping-orders');
const mailSender = buildQueueName(SERVICE, 'mail-sender');
const stockAction = buildQueueName(SERVICE, 'stock-actions');
const balancesRestore = buildQueueName(SERVICE, 'balances-restore');

config.redisHost = process.env.BULL_REDIS_HOST || '';
config.redisPort = parseInt(process.env.BULL_REDIS_PORT || 6379, 10);

config.prefs = {
  lockDuration: parseInt(process.env.BULL_REVIVABLE_LOCK_DURATION || 3000, 10),
  stalledInterval: parseInt(process.env.BULL_REVIVABLE_STALLED_INTERVAL || 5000, 10),
  backoffDelay: parseInt(process.env.BULL_REVIVABLE_BACKOFF_DELAY || 1000, 10),
  stackTraceLimit: parseInt(process.env.BULL_REVIVABLE_STACK_TRACE_LIMIT || 3, 10),
  defaultConcurrency: parseInt(process.env.BULL_DEFAULT_CONCURRENCY || 1024, 10),
};

config.ratingCalculation = {
  ticksFetcher: {
    jobs: {
      scheduleUpdates: buildQueueName(ticksFetcher, JOB, 'schedule-updates'),
      processUpdates: buildQueueName(ticksFetcher, JOB, 'process-updates'),
    },
  },
  currencyConverter: {
    jobs: {
      scheduleUpdates: buildQueueName(currencyConverter, JOB, 'schedule-updates'),
      processUpdates: buildQueueName(currencyConverter, JOB, 'process-updates'),
    },
  },
  ratingCalculator: {
    jobs: {
      scheduleUpdates: buildQueueName(ratingCalculator, JOB, 'schedule-updates'),
      processUpdates: buildQueueName(ratingCalculator, JOB, 'process-updates'),
    },
  },
};

config.marketParser = {
  jobs: {
    listenTicks: buildQueueName(marketParser, JOB, 'listen-ticks'),
    processPairs: buildQueueName(marketParser, JOB, 'process-pairs'),
    scheduleProcessPairs: buildQueueName(marketParser, JOB, 'schedule-process-pairs'),
  },
};

config.transfers = {
  jobs: {
    scheduleTransferUpdates: buildQueueName(transfersFetch, JOB, 'schedule-transfer-update'),
    transferUpdate: buildQueueName(transfersFetch, JOB, 'transfer-update'),
  },
};

config.user = {
  listener: {
    jobs: {
      ensureJobs: buildQueueName(userListener, JOB, 'ensure-jobs'),
      listen: buildQueueName(userListener, JOB, 'listen'),
    },
    events: {
      validatedKey: buildQueueName(userListener, EVENT, 'new-key'),
    },
  },
  balance: {
    jobs: {
      update: buildQueueName(balanceUpdate, JOB, 'update'),
      scheduleBalanceUpdates: buildQueueName(balanceUpdate, JOB, 'schedule-balance-update'),
      fetchUpdate: buildQueueName(balanceUpdate, JOB, 'fetch-update'),
    },
  },
};

config.balancesFetcher = {
  balances: {
    jobs: {
      scheduleBalanceUpdates: buildQueueName(balanceUpdate, JOB, 'schedule-balance-update'),
      updateBalance: buildQueueName(balanceUpdate, JOB, 'update-balance'),
    },
  },
  pairs: {
    jobs: {
      schedulePairsUpdate: buildQueueName(balanceUpdate, JOB, 'schedule-pairs-update'),
      updatePairs: buildQueueName(balanceUpdate, JOB, 'update-pairs'),
    },
  },
};

config.keysValidation = {
  jobs: {
    addKey: buildQueueName(keysValidation, JOB, 'add-key'),
    updateKey: buildQueueName(keysValidation, JOB, 'update-key'),
    validateKey: buildQueueName(keysValidation, JOB, 'validate'),
    scheduleUpdates: buildQueueName(keysValidation, JOB, 'schedule'),
  },
};

config.stockPairsFetcher = {
  jobs: {
    schedulePairsUpdate: buildQueueName(stockPairsFetcher, JOB, 'schedule'),
    updatePairs: buildQueueName(stockPairsFetcher, JOB, 'update'),
  },
};

config.following = {
  jobs: {
    ensureJobs: buildQueueName(following, JOB, 'ensure'),
    follow: buildQueueName(following, JOB, 'follow'),
    addFollow: buildQueueName(following, JOB, 'add-follow'),
    quality: buildQueueName(following, JOB, 'quality'),
    sheduleQuality: buildQueueName(following, JOB, 'shedule-quality'),
  },
};

config.snapshotsCollector = {
  jobs: {
    makeOrder: buildQueueName(following, JOB, 'make-order'),
    makeSnapshot: buildQueueName(following, JOB, 'make-snapshot'),
  },
};

config.aggOHLC = {
  jobs: {
    ensureJobs: buildQueueName(aggOHLC, JOB, 'ensure-v2'),
    updateOHLC: buildQueueName(aggOHLC, JOB, 'updateOHLC-v2'),
  },
};

config.keyTrades = {
  jobs: {
    ensurePairsJob: buildQueueName(keyTrades, JOB, 'ensure-pairs'),
    tradesJob: buildQueueName(keyTrades, JOB, 'trades-v3'),
  },
};

config.rating = {
  jobs: {
    ensureJobs: buildQueueName(rating, JOB, 'ensure-v2'),
    ratingJob: buildQueueName(rating, JOB, 'rating-v4'),
  },
};

config.lessRating = {
  jobs: {
    ensureJobs: buildQueueName(lessRating, JOB, 'ensure-v1'),
    ratingJob: buildQueueName(lessRating, JOB, 'rating-v1'),
  },
};

config.mailSender = {
  jobs: {
    changePasswordRequest: buildQueueName(mailSender, JOB, 'change-password-request'),
    changePasswordAction: buildQueueName(mailSender, JOB, 'change-password-action'),
    changeEmailRequest: buildQueueName(mailSender, JOB, 'change-email-request'),
    changeEmailAction: buildQueueName(mailSender, JOB, 'change-email-action'),
    signUp: buildQueueName(mailSender, JOB, 'sign-up'),
  },
};

config.ordersPing = {
  jobs: {
    ensureJobs: buildQueueName(ordersPing, JOB, 'ensure-v2'),
    pingJob: buildQueueName(ordersPing, JOB, 'ping-v2'),
    syncJob: buildQueueName(ordersPing, JOB, 'sync-v2'),
  },
};

config.stockAction = {
  jobs: {
    ensureJobs: buildQueueName(stockAction, JOB, 'ensure'),
    execute: buildQueueName(stockAction, JOB, 'execute'),
    add: buildQueueName(stockAction, JOB, 'add'),
  },
};

config.balancesRestore = {
  jobs: {
    ensureJobs: buildQueueName(balancesRestore, JOB, 'ensure'),
    recent: buildQueueName(balancesRestore, JOB, 'recent'),
    markup: buildQueueName(balancesRestore, JOB, 'markup'),
    restore: buildQueueName(balancesRestore, JOB, 'restore'),
  },
};

module.exports = config;
