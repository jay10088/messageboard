const { where } = require('sequelize');

// app/controller/message.js
const Controller = require('egg').Controller;

class MessageController extends Controller {
  async show() {
    const rows = await this.ctx.model.Message.findAll({
      attributes: ['id', 'content'],
      order: [['id', 'DESC']],
      limit: 20,
      raw: true,
    });
    this.ctx.body = rows;
  }

  async create() {
    const { ctx } = this;
    //驗證
    const rule = {
      content: { type: 'string', required: true, trim: true, min: 1, max: 20 },
    };
    ctx.validate(rule, ctx.request.body);

    const { content } = ctx.request.body;
    const row = await ctx.model.Message.create({ content });

  }

  async update(){
  const {ctx} = this;
  const rule = {
    content: { type: 'string', required: true, trim: true, min: 1, max: 20 },
  };
  ctx.validate(rule, ctx.request.body);

  const {id} = ctx.params;
  const {content} = ctx.request.body;
  console.log({id});
  const [affected] = await ctx.model.Message.update(
    { content },
    { where: { id } }
  );
}


  async destroy(){
    const { id } = this.ctx.params;
    const row = await this.ctx.model.Message.destroy({where: {id}});
  }
}
module.exports = MessageController;
