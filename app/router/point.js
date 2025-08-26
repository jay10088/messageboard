
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  //router.get('/api/addValue/:id' , controller.point.showData);
  router.post('/api/addValue' , controller.point.addValue);
};
