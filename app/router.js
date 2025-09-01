
/**
 * @param {Egg.Application} app - egg application
 */
// app/router.js
module.exports = app => {
  const { router, controller, middleware } = app;

  //登入驗證middleware
  const userAuth = middleware.auth(['user']);
  const staffAuth = middleware.auth(['staff']);

  //首頁
  router.redirect('/', '/public/index.html', 302);

  // login相關
  router.post('/api/login', controller.login.login);
  router.post('/api/register', controller.login.register);
  router.post('/api/logout', userAuth , controller.login.logout);
  router.get('/api/loginInfo', controller.login.loginInfo);

  // 留言板
  router.get('/api/message', controller.messageBoard.show);
  router.post('/api/message' , userAuth ,  controller.messageBoard.create);
  router.put('/api/message/:id', userAuth , controller.messageBoard.update);
  router.delete('/api/message/:id', userAuth , controller.messageBoard.destroy);

  // 計算點數
  router.post('/api/addPoint', userAuth , controller.point.addPoint);
  router.post('/api/managePoint/:username', staffAuth , controller.point.managePoint);
  router.get('/api/showAllPointHistory', staffAuth, controller.point.showAllPointHistory);
  router.get('/api/showUserPointHistory/:username', staffAuth, controller.point.showUserPointHistory);
  router.get('/api/pointInfo/:username', userAuth, controller.point.pointInfo);
};
