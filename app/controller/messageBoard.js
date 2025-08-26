const path = require('path');
const { where } = require('sequelize');
const rules = require(path.join( __dirname , '../validate/rules'));

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

  async create() {
    const { ctx } = this;
    let resultStatus = 200;
    let resultBody = { ok: true , msg: '新增成功'};
    const content = (ctx.request.body.content).trim();
    ctx.validate(rules.contentRule, ctx.request.body);

    //判斷登入
    if (!ctx.session?.user) {
      resultStatus = 401;
      resultBody = { ok: false , msg: '未登入，請先登入' };
    } 
    //判斷內容為空
    else if (!content) {
      resultStatus = 422;
      resultBody = { ok: false , msg: '內容不可為空' };
    }
    //如果沒錯誤，寫入資料庫
    else {
      const username = ctx.session.user?.username || '';
      await ctx.model.Message.create( { content, username } );
    }

    ctx.status = resultStatus;

    ctx.body = resultBody;
  }


  async update(){
    const { ctx } = this;
    //參數驗證
    ctx.validate(rules.idRule, ctx.params);
    ctx.validate(rules.contentRule, ctx.request.body);

    let resultStatus = 200;
    let resultBody = { ok: true , msg: '更新成功'};
    const { id } = ctx.params;
    const content = (ctx.request.body.content).trim();
    const username = ctx.session.user?.username || '';
    const messageUser = await ctx.model.Message.findOne( { where: { id } } );
    //權限判斷
    if(username !== messageUser.username) {
      resultStatus = 400;
      messageUser = { ok: false , msg: '你不能更改別人的留言' };
    }
    else if (!content) {
      resultStatus = 422;
      resultBody = { ok: false , msg: '內容不可為空' };
    }
    else{
      const [affected] = await ctx.model.Message.update(
      { content },
      { where: { id } });
    }

    ctx.status = resultStatus;

    ctx.body = resultBody;
  }


  async destroy(){
    const { ctx } = this;
        
    ctx.validate(rules.idRule, ctx.params);
    let resultStatus = 200;
    let resultBody = { ok: true , msg: '刪除成功'};
    const { id } = ctx.params;
    const username = ctx.session.user?.username || '';
    const messageUser = await ctx.model.Message.findOne( { where: { id } } );

    //判斷權限
    if(username !== messageUser.username) {
      resultStatus = 403;
      resultBody = { msg: '你沒有權限刪除' };
    }
    else{
      await ctx.model.Message.destroy( { where: { id } } );
    }

    ctx.status = resultStatus;
    
    ctx.body = resultBody;
  }
}

module.exports = messageController;
