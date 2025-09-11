'use strict';

const Redlock = require('redlock').default;

module.exports = app => {
  
  app.beforeStart(async () => {
    app.redlock = new Redlock([app.redis], app.config.redlock);
  });
}
