
/**
 * @param {Egg.Application} app - egg application
 */
// app/router.js
module.exports = app => {
  require('./router/index')(app);
  require('./router/message')(app);
  require('./router/login')(app);
};

