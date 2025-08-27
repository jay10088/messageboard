'use strict'

const Controller = require('egg').Controller;

class PointController extends Controller {
  async addPoint() {
    const { ctx } = this;
    const returnStatus = 200;
    const returnBody = { msg: '儲值成功' };

    //驗證
    const pointRule = {
      id: { type: 'int', min: 1, required: true, convertType: 'int' }
    };
    ctx.validate(rules.pointRule, ctx.request.body);

    const { point } = ctx.request.body;
    const userId = ctx.session.user.id;
    
    await ctx.model.User.increment('point', {
      by: point,
      where: { id: userId },
    });

    ctx.status = returnStatus;

    ctx.body = returnBody;
  }
}

module.exports = PointController;
