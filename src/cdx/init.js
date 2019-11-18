const DB = require('./db');
const Web = require('./web');
const Stock = require('./stock');

class CDX {
  constructor(config) {
    this.config = config;

    this.db = new DB(this.config);
    this.web = new Web(this.config);
    this.stock = new Stock(this.config, this.db);
  }
}

module.exports = config => new CDX(config);
