'use strict'

const Controller = require('egg').Controller;

class MessageController extends Controller {

  //顯示留言
  async show() {
    const { ctx, app } = this;
    let messageData = await ctx.service.cache.getMessageHistoryCache();

    if (!messageData) {
      messageData = await ctx.model.Message.findAll({
        attributes: ['id', 'content' , 'username'],
        order: [['id', 'DESC']],
        limit: 20,
        raw: true,
      });
      await ctx.service.cache.setMessageHistoryCache(messageData);
    }

    ctx.body = messageData;
  }

  //新增留言
  async create() {
    const { ctx, app } = this;
    let returnStatus = 200;
    let returnBody = { msg: '新增成功' };

    //驗證
    const rules = {
      content: { type: 'string', trim: true, min: 1, max: 20, required: true }
    }
    ctx.validate(rules, ctx.request.body);

    const content = (ctx.request.body.content).trim();
    const username = ctx.session.user.username;
    const point = ctx.session.user.point;

    // 判斷點數
    if (point <= 0) {
      returnStatus = 400;
      returnBody = { msg: '點數不足，請先儲值' };
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
        returnStatus = 400;
        returnBody = { msg: '寫入資料庫失敗' };
      }
    }

    //正常寫入的話，清除留言及點數cache，接著更新session
    if (returnStatus === 200) {
      await ctx.service.cache.clearUserCache(username);
      await ctx.service.cache.clearMessageCache();
      await ctx.service.cache.clearPointCache(username);

      //更新session
      const updatedpoint = ctx.session.user.point - 1;
      ctx.session.user.point = updatedpoint;
    }

    ctx.status = returnStatus;

    ctx.body = returnBody;
  }

  //更改留言
  async update() {
    const { ctx, app } = this;
    let returnStatus = 200;
    let returnBody = { msg: '更新成功' };

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
      returnStatus = 400;
      returnBody = { msg: '你不能更改此留言' };
    }

    //清除cache
    if (returnStatus === 200) {
      await ctx.service.cache.clearMessageCache();
    }
    ctx.status = returnStatus;

    ctx.body = returnBody;
  }

  //刪除留言
  async destroy() {
    const { ctx, app } = this;
    let returnStatus = 200;
    let returnBody = { msg: '刪除成功' };
        
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
      returnStatus = 400;
      returnBody = { msg: '你不能刪除此留言' };
    }

    //清除cache
    if (returnStatus === 200) {
      await ctx.service.cache.clearMessageCache();
    }
    ctx.status = returnStatus;
    
    ctx.body = returnBody;
  }
}

module.exports = MessageController;
