
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  //router.get('/login' , ctx => ctx.redirect('/public/login.html'));
  router.post('/login' , controller.login.login);
  router.post('/register', controller.login.register);
  router.post('/logout', controller.login.logout);
};
