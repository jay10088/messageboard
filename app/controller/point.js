'use strict'

const Controller = require('egg').Controller;

class PointController extends Controller {

  //顯示全部點數交易歷史
  async showAllPointHistory() {
    const { ctx, app } = this;

    let pointHistoryData = await ctx.service.cache.getPointHistoryCache();

    ctx.body = pointHistoryData;
  }

  //顯示特定使用者交易歷史
  async showUserPointHistory() {
    const { ctx, app } = this;
    
    //驗證
    const rules = {
      username: { type: 'string', required: true, allowEmpty: false },
    }
    ctx.validate(rules, ctx.params);
    
    const { username } = ctx.params;    
    let pointHistoryData = await ctx.service.cache.getUserPointHistoryCache(username);
    
    ctx.body = pointHistoryData;
  }

  //新增點數
  async addPoint() {
    const { ctx, app } = this;
    let returnStatus = 200;
    let returnBody = { msg: '儲值成功' };
    
    try {
      //驗證
      const rule = {
        point: { type: 'int', min: 1, required: true, convertType: 'int' }
      };
      ctx.validate(rule, ctx.request.body);
      const { point } = ctx.request.body;
      const username = ctx.session.user.username;
      //增加點數
      await ctx.service.point.topupPoint(username, point, 'USER_TOP_UP');
      await ctx.service.cache.clearPointCache(username);
    } catch (err) {
      returnStatus = 400;
      returnBody = { msg: err.message };
    }
    ctx.status = returnStatus;

    ctx.body = returnBody;
  }

  //管理特定使用者點數（只開放給管理員用）
  async managePoint() {
    const { ctx, app } = this;
    let returnStatus = 200;
    let returnBody = { msg: '儲值成功' };

    try {
      //驗證
      const pointRule = {
        point: { type: 'int', required: true, convertType: 'int' }
      };
      ctx.validate(pointRule, ctx.request.body);
      const paramsRule = {
        username: { type: 'string', required: true, allowEmpty: false },
      }
      ctx.validate(paramsRule , ctx.params);

      const { point } = ctx.request.body;
      const { username } = ctx.params;
      const hasUser = ctx.model.User.findOne( { username } );

      //管理點數
      if (hasUser) {
        await ctx.service.point.topupPoint(username, point, 'STAFF_TOP_UP');
        await ctx.service.cache.clearPointCache(username);
      }
    } catch (err) {
      returnStatus = 400;
      returnBody = { msg: err.message };
    }
    
    ctx.status = returnStatus;

    ctx.body = returnBody;
  }
}

module.exports = PointController;
