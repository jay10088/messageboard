'use strict'

const Controller = require('egg').Controller;

class PointController extends Controller {

  //指定使用者的點數資訊
  async pointInfo() {
    const { ctx } = this;

    //驗證
    const rules = {
      username: { type: 'string', required: true, allowEmpty: false },
    }
    ctx.validate(rules , ctx.params);

    const { username } = ctx.params;
  
    const rows = await ctx.model.User.findOne({
      where: { username },
      attributes: ['username', 'point'],
      raw: true,
    });

    ctx.body = rows;
  }

  //顯示全部點數交易歷史
  async showAllPointHistory() {
    const { ctx } = this;
  
    const rows = await ctx.model.Point.findAll({
      attributes: ['id', 'username', 'delta', 'createdAt'],
      order: [['id', 'DESC']],
      limit: 18,
      raw: true,
    });

    ctx.body = rows;
  }

  //顯示特定使用者交易歷史
  async showUserPointHistory() {
    const { ctx } = this;
    const { username } = ctx.params;

    //驗證
    const rules = {
      username: { type: 'string', required: true, allowEmpty: false },
    }
    ctx.validate(rules , ctx.params);
  
    const rows = await ctx.model.Point.findAll({
      where: { username },
      attributes: ['id', 'username', 'delta', 'createdAt'],
      order: [['id', 'DESC']],
      limit: 18,
      raw: true,
    });

    ctx.body = rows;
  }

  //儲值目前使用者點數(給一般使用者使用)
  async addPoint() {
    const { ctx } = this;
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
      
    ctx.status = returnStatus;

    ctx.body = returnBody;
  }

  //管理特定使用者點數（只開放給管理員用）
  async managePoint() {
    const { ctx } = this;
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
       
    ctx.status = returnStatus;

    ctx.body = returnBody;
  }
}

module.exports = PointController;
