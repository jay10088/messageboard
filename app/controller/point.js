'use strict'

const Controller = require('egg').Controller;

class PointController extends Controller {

  //顯示全部點數交易歷史
  async showAllPointHistory() {
    const { ctx, app } = this;

    let pointHistoryData = await ctx.service.cache.getPointHistoryCache();

    if (!pointHistoryData) {
      pointHistoryData = await ctx.model.Point.findAll({
        attributes: ['id', 'username', 'delta', 'createdAt'],
        order: [['id', 'DESC']],
        limit: 18,
        raw: true,
      });

      //mysql有找到寫入redis
      if (pointHistoryData) {
        await ctx.service.cache.setPointHistoryCache(pointHistoryData);
      }
    }

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
    
    if (!pointHistoryData) {
      pointHistoryData = await ctx.model.Point.findAll({
        where: { username },
        attributes: ['id', 'username', 'delta', 'createdAt'],
        order: [['id', 'DESC']],
        limit: 18,
        raw: true,
      });
      
      //mysql有找到寫入redis
      if (pointHistoryData) {
        await ctx.service.cache.setUserPointHistoryCache(username, pointHistoryData);
      }
    }
    
    ctx.body = pointHistoryData;
  }

  //儲值目前使用者點數(給一般使用者使用)
  async addPoint() {
    const { ctx, app } = this;
    let returnStatus = 200;
    let returnBody = { msg: '儲值成功' };

    //驗證
    const rule = {
      point: { type: 'int', min: 1, required: true, convertType: 'int' }
    };
    ctx.validate(rule, ctx.request.body);

    const { point } = ctx.request.body;
    const username = ctx.session.user.username;

    //原子操作資料庫
    const t = await ctx.model.transaction();
    try {
      await ctx.model.User.increment('point', { by: point, where: { username: username }, transaction: t } );
      await ctx.model.Point.create( { delta: point, username: username }, { transaction: t } );
      await t.commit();
    } catch (err) {
      await t.rollback();
      returnStatus = 400;
      returnBody = { msg: '寫入資料庫失敗' };
    }

    //寫入mysql成功後 清除redis紀錄並更新session
    if (returnStatus === 200) {
      await ctx.service.cache.clearUserCache(username);
      await ctx.service.cache.clearPointCache(username);
      
      //更新sessiom
      const updatedPoint = ctx.session.user.point + point;
      ctx.session.user.point = updatedPoint;   
    }
      
    ctx.status = returnStatus;

    ctx.body = returnBody;
  }

  //管理特定使用者點數（只開放給管理員用）
  async managePoint() {
    const { ctx, app } = this;
    let returnStatus = 200;
    let returnBody = { msg: '儲值成功' };

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

    //原子操作資料庫
    const t = await ctx.model.transaction();
    try {
      await ctx.model.User.increment('point', { by: point, where: { username: username }, transaction: t } );
      await ctx.model.Point.create( { delta: point, username: username }, { transaction: t } );
      await t.commit();
    } catch (err) {
      await t.rollback();
      returnStatus = 400;
      returnBody = { msg: '寫入資料庫失敗' };
    }

    //寫入mysql成功後 清除redis紀錄並更新session
    if (returnStatus === 200) {
      await ctx.service.cache.clearUserCache(username);
      await ctx.service.cache.clearPointCache(username);

      if (ctx.session.user.username === username) {
        const updatedPoint = ctx.session.user.point + point;
        ctx.session.user.point = updatedPoint;
      }
    }
       
    ctx.status = returnStatus;

    ctx.body = returnBody;
  }
}

module.exports = PointController;
