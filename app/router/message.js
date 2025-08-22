
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/api/message',controller.messageBoard.show);
  router.post('/api/message' , controller.messageBoard.create);
  router.put('/api/message/:id' , controller.messageBoard.update);
  router.delete('/api/message/:id' , controller.messageBoard.destroy);
};
