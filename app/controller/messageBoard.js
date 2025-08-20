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
    const contentRule = {
      content: { type: 'string', required: true, trim: true, min: 1, max: 40 },
    };
    ctx.validate(contentRule, ctx.request.body);

    const { content } = ctx.request.body;
    const row = await ctx.model.Message.create({ content });

  }

  async update(){
  const {ctx} = this;

  const idRule = {
    id: {type: 'int' , trim:true , min: 1},
  }
  ctx.validate(idRule , ctx.params);

  const contentRule = {
    content: { type: 'string', required: true, trim: true, min: 1, max: 40 },
  };
  ctx.validate(contentRule, ctx.request.body);

  const {id} = ctx.params;
  const {content} = ctx.request.body;

  const [affected] = await ctx.model.Message.update(
    { content },
    { where: { id } }
  );
}


  async destroy(){
    const{ctx} = this;

    const idRule = {
      id: {type: 'int' , trim: true , min: 1},
    }
    ctx.validate(idRule , ctx.params);

    const { id } = ctx.params;
    const row = await ctx.model.Message.destroy({where: {id}});
  }
}
module.exports = MessageController;
