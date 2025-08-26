'use strict'
const path = require('path');
const rules = require(path.join( __dirname , '../validator/rules'));

const Controller = require('egg').Controller;

class messageController extends Controller {
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

    try {
      //驗證
      ctx.validate(rules.contentRule, ctx.request.body);
      const content = (ctx.request.body.content).trim();
      

      //判斷登入
      if (!ctx.session?.user) {
        resultStatus = 400;
        resultBody = { msg: '未登入，請先登入' };
      } 
      else {
        const username = ctx.session.user.username;
        const { value } = await ctx.model.User.findOne({
          where: { username },
          attributes: ['value'],
          raw: true,
        });
        // 判斷點數
        if (value <= 0) {
          resultStatus = 400;
          resultBody = { msg: '點數不足，請先儲值' };
        }
        else {
          //如果沒錯誤，寫入資料庫，並花費點數
          await ctx.model.Message.create( { content, username } );
          await ctx.model.User.decrement('value' , {
            by: 1,
            where: {username},
          })
        }
      }

      ctx.status = resultStatus;

      ctx.body = resultBody;
    }
    catch (err) {
      if (err.name === 'UnprocessableEntityError') {
        ctx.status = 422;

        ctx.body = { msg: '內容不可為空或多於20字' };
      }
    }
    
  }

  //更改留言
  async update(){
    const { ctx } = this;
    let resultStatus = 200;
    let resultBody = { msg: '更新成功'};

    try{
      //驗證
      ctx.validate(rules.idRule, ctx.params);
      ctx.validate(rules.contentRule, ctx.request.body);

      const { id } = ctx.params;
      const content = ctx.request.body.content?.trim() ?? '';
      const username = ctx.session.user?.username || '';
      const messageUser = await ctx.model.Message.findOne( { where: { id } } );
      //權限判斷
      if(username !== messageUser.username) {
        resultStatus = 400;
        resultBody = { msg: '你不能更改此留言' };
      }
      else{
        const [affected] = await ctx.model.Message.update(
        { content },
        { where: { id } });
      }

      ctx.status = resultStatus;

      ctx.body = resultBody;
    }
    catch (err) {
      if (err.name === 'UnprocessableEntityError') {
        ctx.status = 422;

        ctx.body = { msg: '內容不可為空或多於20字' };
      }
    }
    
  }

  //刪除留言
  async destroy(){
    const { ctx } = this;
    let resultStatus = 200;
    let resultBody = { msg: '刪除成功'};
        
    ctx.validate(rules.idRule, ctx.params);
    const { id } = ctx.params;
    const username = ctx.session.user?.username || '';
    const messageUser = await ctx.model.Message.findOne( { where: { id } } );

    //判斷權限
    if(username !== messageUser.username) {
      resultStatus = 403;
      resultBody = { msg: '你不能刪除此留言' };
    }
    else{
      await ctx.model.Message.destroy( { where: { id } } );
    }

    ctx.status = resultStatus;
    
    ctx.body = resultBody;
  }
}

module.exports = messageController;
