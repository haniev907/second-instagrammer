const util = require('util');
const validate = require('validate.js');

const express = require('express');
const request = util.promisify(require('request'));
const config = require('@cdx/config');
const cdx = require('@cdx/core')(config);
const cdxUtil = require('@cdx/util');
const { userRouter, productsRouter } = require('./router')(config, cdx);

const server = cdx.web.server();
const router = express.Router();

router.use(express.json());

/**
  * @swagger
  * /ping:
  *    get:
  *      summary: Ping
  *      tags:
  *        - Auth
  *      description: Pong
  *      responses:
  *        200:
  *          schema:
  *            type: object
  *            properties:
  *              data:
  *                type: object
  *              error:
  *                type: string
  *              code:
  *                type: integer
*/
router.get('/ping', (_, res) => {
  res.json(new cdxUtil.UserResponseOK());
});

// Register all the routers
server.registerRouter('/', router);
server.registerRouter('/user', userRouter);

// Catch the errors
server.app.use((err, req, res, next) => {
  // - Send the expection to the Sentry
  // -- Won't be broken in case the Sentry is disabled
  // cdxUtil.sentry.captureException(err);

  // logger.error('error', { message: err.message }, config.logging.api.basic);

  if (err instanceof cdxUtil.UserError) {
    // - The error details should be returned to the client
    const response = new cdxUtil.UserResponse(
      null,
      err,
    );

    res.json(response.json());
  } else {
    // - Some interval error has happend, no need to reveal the details
    const response = new cdxUtil.UserResponse(
      null,
      new Error('Internal error'),
      500,
    );

    res.json(response.json());
  }

  return next();
});


server.start();
