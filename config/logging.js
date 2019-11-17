const delimiter = '::';

const buildLogClass = (...messages) => [...messages].join(delimiter);

// Prefixes by services
const db = buildLogClass('db');
const instAuth = buildLogClass('inst-auth');
const api = buildLogClass('api');

// Prefixes by logic
const config = {
  instAuth: {
    basic: buildLogClass(instAuth, 'basic'),
  },
};


module.exports = config;
