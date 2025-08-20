
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', ctx => ctx.redirect('/public/index.html'));
  router.get('/message',controller.messageBoard.show);
  router.post('/message' , controller.messageBoard.create);
  router.put('/message/:id' , controller.messageBoard.update);
  router.delete('/message/:id' , controller.messageBoard.destroy);
};
