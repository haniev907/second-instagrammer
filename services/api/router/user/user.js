const express = require('express');
const Controllers = require('./controllers');

const router = express.Router();
const init = (config, cdx) => {
  const controllers = Controllers.init(config, cdx);

  router.use(express.json());

  // router.put('/details/sensitive', controllers.updateUserSensitiveDetails);

  return router;
};


module.exports = (config, cdx) => init(config, cdx);
