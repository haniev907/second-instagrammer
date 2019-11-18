const instagramApi = require('./api-instagram');

class Stock {
  constructor(config, db) {
    this.api = instagramApi(config, db)
  }
}

module.exports = Stock;

