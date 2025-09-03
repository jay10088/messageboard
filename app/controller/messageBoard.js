'use strict'

const Controller = require('egg').Controller;

class MessageController extends Controller {

  //顯示留言
  async show() {
    const { ctx } = this;
  
    const rows = await ctx.model.Message.findAll({
      attributes: ['id', 'content' , 'username'],
      order: [['id', 'DESC']],
      limit: 20,
      raw: true,
    });

    ctx.body = rows;
  }

  //新增留言
  async create() {
    const { ctx } = this;
    let resultStatus = 200;
    let resultBody = { msg: '新增成功' };

    //驗證
    const rules = {
      content: { type: 'string', trim: true, min: 1, max: 20, required: true }
    }
    ctx.validate(rules, ctx.request.body);

    const content = (ctx.request.body.content).trim();
    const username = ctx.session.user.username;
    const { point } = await ctx.model.User.findOne({
      where: { username },
      attributes: ['point'],
      raw: true,
    });

    // 判斷點數
    if (point <= 0) {
      resultStatus = 400;
      resultBody = { msg: '點數不足，請先儲值' };
    } else {
      //如果沒錯誤，寫入資料庫，並花費點數（全部正確執行才寫入，否則rollback)
      const t = await ctx.model.transaction();
      try {
        await ctx.model.Message.create( { content, username }, { transaction: t } );
        await ctx.model.User.decrement('point', { by: 1, where: { username }, transaction: t } );
        await ctx.model.Point.create( { delta: -1, username: username }, { transaction: t } );
        await t.commit();
      } catch (err) {
        await t.rollback();
        resultStatus = 400;
        resultBody = { msg: '寫入資料庫失敗' };
      }
    }

    ctx.status = resultStatus;

    ctx.body = resultBody;
  }

  //更改留言
  async update() {
    const { ctx } = this;
    let resultStatus = 200;
    let resultBody = { msg: '更新成功' };

    //驗證api id
    const paramsRule = {
      id: { type: 'int', min: 1, required: true, convertType: 'int' }
    };
    ctx.validate(paramsRule, ctx.params);

    //驗證 body
    const bodyRule = {
      content: { type: 'string', trim: true, min: 1, max: 20, required: true }
    };
    ctx.validate(bodyRule, ctx.request.body);

    const { id } = ctx.params;
    const content = ctx.request.body.content.trim();
    const username = ctx.session.user.username;
    const messageUser = await ctx.model.Message.findOne( { where: { id } } );
    //權限判斷
    if (username === messageUser.username) {
      await ctx.model.Message.update( { content } , { where: { id } } );
    } else {
      resultStatus = 400;
      resultBody = { msg: '你不能更改此留言' };
    }

    ctx.status = resultStatus;

    ctx.body = resultBody;
  }

  //刪除留言
  async destroy() {
    const { ctx } = this;
    let resultStatus = 200;
    let resultBody = { msg: '刪除成功' };
        
    //驗證api id
    const paramsRule = {
      id: { type: 'int', min: 1, required: true, convertType: 'int' }
    };
    ctx.validate(paramsRule, ctx.params);

    const { id } = ctx.params;
    const username = ctx.session.user.username;
    const role = ctx.session.user.role;
    const messageUser = await ctx.model.Message.findOne( { where: { id } } );

    //判斷權限
    if (username === messageUser.username  || role === 'staff') {
      await ctx.model.Message.destroy( { where: { id } } );
    } else {
      resultStatus = 403;
      resultBody = { msg: '你不能刪除此留言' };
    }

    ctx.status = resultStatus;
    
    ctx.body = resultBody;
  }
}

module.exports = MessageController;
