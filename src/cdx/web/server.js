const express = require('express');
require('express-async-errors');

const cdxUtil = require('@cdx/util');
const cors = require('cors');

const logger = cdxUtil.logging;

class Server {
  constructor(config) {
    this.app = express();
    this.config = config.server.express;
    const whitelist = this.config.CORSOrigin.split(',');

    this.app.use(cors({ credentials: true, origin: whitelist }));
  }

  registerRouter(root, router) {
    this.app.use(root, router);
  }

  start() {
    const cb = (err) => {
      if (err) throw new Error(err);

      logger.info(
        'start',
        { host: this.config.host, port: this.config.port },
        'server',
      );
    };

    this.app.listen(this.config.port, this.config.host, cb);

    console.l
  }
}

module.exports = Server;
