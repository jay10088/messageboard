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

  if (!ctx.session?.user) {
    ctx.status = 401;
    ctx.body = { msg: '未登入，請先登入' };
    return;
  }

  ctx.validate(rules.contentRule, ctx.request.body);

  const content = (ctx.request.body.content).trim();
  if (!content) {
    ctx.status = 422;
    ctx.body = { msg: '內容不可為空' };
    return;
  }

  const username = ctx.session.user.username;

  const created = await ctx.model.Message.create( { content, username } );

  ctx.status = 201;
  ctx.body = {
    ok: true
  };
}


  async update(){
  const { ctx } = this;
  ctx.validate(rules.idRule, ctx.params);
  ctx.validate(rules.contentRule, ctx.request.body);

  const { id } = ctx.params;
  const { content } = ctx.request.body;
  const username = ctx.session.user.username;

  const msguser = await ctx.model.Message.findOne( { where: { id } } );
  if(username !== msguser.username) {
      ctx.status = 400;
      ctx.body = { msg: '你不能更改別人的留言' };

      return;
    }

  const [affected] = await ctx.model.Message.update(
    { content },
    { where: { id } }
  );

  ctx.status = 201;
  ctx.body = { ok : true , msg : '更改完成'};
}


  async destroy(){
    const { ctx } = this;
        
    ctx.validate(rules.idRule, ctx.params);
    const { id } = ctx.params;
    const username = ctx.session.user.username;
    const msguser = await ctx.model.Message.findOne( { where: { id } } );

    if(username !== msguser.username) {
      ctx.status = 403;
      ctx.body = { msg: '你不能刪除別人的留言' };

      return;
    }
    
    await ctx.model.Message.destroy( { where: { id } } );

    ctx.status = 200;
  }
}

module.exports = messageController;
