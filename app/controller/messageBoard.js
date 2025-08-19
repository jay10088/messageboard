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

  async create(){
    const row = await this.ctx.model.Message.create(this.ctx.request.body);
  }

  async destroy(){
    const { id } = this.ctx.params;
    const row = await this.ctx.model.Message.destroy({where: {id}});
  }
}
module.exports = MessageController;
