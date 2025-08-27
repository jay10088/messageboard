
/**
 * @param {Egg.Application} app - egg application
 */
// app/router.js
module.exports = app => {
  const { router, controller, middleware } = app;

  //登入驗證middleware
  const auth = middleware.auth();

  //首頁
  router.redirect('/', '/public/index.html', 302);

  // login相關
  router.post('/api/login', controller.login.login);
  router.post('/api/register', controller.login.register);
  router.post('/api/logout', auth , controller.login.logout);
  router.get('/api/loginInfo', auth , controller.login.loginInfo);

  // 留言板
  router.get('/api/message', controller.messageBoard.show);
  router.post('/api/message' , auth ,  controller.messageBoard.create);
  router.put('/api/message/:id', auth , controller.messageBoard.update);
  router.delete('/api/message/:id', auth , controller.messageBoard.destroy);

  // 計算點數
  router.post('/api/addPoint', auth , controller.point.addPoint);
};
