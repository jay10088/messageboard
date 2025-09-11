

module.exports = app => {
  const { router, controller, middleware } = app;

  //登入驗證middleware
  const loginAuth = middleware.loginAuth();
  const staffAuth = middleware.roleAuth(['staff']);

  //首頁
  router.redirect('/', '/public/index.html', 302);

  // login相關
  router.post('/api/login', controller.login.login);
  router.post('/api/register', controller.login.register);
  router.post('/api/logout', loginAuth, controller.login.logout);
  router.get('/api/myInfo', controller.login.findmyInfo);
  router.get('/api/findUserInfo/:username', loginAuth, controller.login.findUserInfo);
  // 留言板
  router.get('/api/message', controller.messageBoard.show);
  router.post('/api/message', loginAuth,  controller.messageBoard.create);
  router.put('/api/message/:id', loginAuth, controller.messageBoard.update);
  router.delete('/api/message/:id', loginAuth, controller.messageBoard.destroy);

  // 計算點數
  router.post('/api/addPoint', loginAuth, controller.point.addPoint);
  router.post('/api/managePoint/:username', loginAuth, staffAuth, controller.point.managePoint);
  router.get('/api/showAllPointHistory', loginAuth, staffAuth, controller.point.showAllPointHistory);
  router.get('/api/showUserPointHistory/:username', loginAuth, staffAuth, controller.point.showUserPointHistory);
};
