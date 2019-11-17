const userRouter = require('./user');

module.exports = (config, cdx) => ({
  userRouter: userRouter(config, cdx),
});
