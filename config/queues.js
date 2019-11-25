const config = {};

const DELIM = '::';
const SERVICE = 'svc';
const JOB = 'job';
const EVENT = 'ev';

const buildQueueName = (...path) => path.join(DELIM);

const instAuth = buildQueueName(SERVICE, 'inst-auth_v3');

config.redisHost = process.env.BULL_REDIS_HOST || '';
config.redisPort = parseInt(process.env.BULL_REDIS_PORT || 6379, 10);

config.prefs = {
  lockDuration: parseInt(process.env.BULL_REVIVABLE_LOCK_DURATION || 3000, 10),
  stalledInterval: parseInt(process.env.BULL_REVIVABLE_STALLED_INTERVAL || 5000, 10),
  backoffDelay: parseInt(process.env.BULL_REVIVABLE_BACKOFF_DELAY || 1000, 10),
  stackTraceLimit: parseInt(process.env.BULL_REVIVABLE_STACK_TRACE_LIMIT || 3, 10),
  defaultConcurrency: parseInt(process.env.BULL_DEFAULT_CONCURRENCY || 1024, 10),
};

config.instAuth = {
  jobs: {
    performance: buildQueueName(instAuth, JOB, 'performance'),
    ensureJobs: buildQueueName(instAuth, JOB, 'ensureJobs'),
  },
};

module.exports = config;
