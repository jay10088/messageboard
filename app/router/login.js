
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  //router.get('/login' , ctx => ctx.redirect('/public/login.html'));
  router.post('/api/login' , controller.login.login);
  router.post('/api/register', controller.login.register);
  router.post('/api/logout', controller.login.logout);
  router.get('/api/loginInfo', controller.login.loginInfo);
};
