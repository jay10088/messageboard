'use strict'
const path = require('path');
const crypto = require(path.join(__dirname , '../lib/crypto'));

const Controller = require('egg').Controller;

class LoginController extends Controller {


  //登入
  async login(){
    const { ctx } = this;
    let resultStatus = 200;
    let resultBody = { msg: '更新成功'};

    //驗證帳密
    const rules = {
      username: { type: 'string', required: true, allowEmpty: false },
      password: { type: 'string', required: true, min: 4, max: 20 }
    }

    ctx.validate(rules, ctx.request.body);
    
    const { username, password } = ctx.request.body;

    const user = await ctx.model.User.findOne({
      where: { username },
      attributes: ['id', 'username', 'password']
    });

    //  判斷是否存在使用者/密碼
    if (user) {
      const isMatch = await crypto.verifyPassword(password, user.password);
      if (isMatch) {
        ctx.session.user = { id: user.id, username: user.username };
        resultStatus = 200;
        resultBody = { msg: '登入成功', user: ctx.session.user };
      } else {                    
        resultStatus = 400;
        resultBody = { msg: '密碼錯誤' };
      }
    } else {
      resultStatus = 400;
      resultBody = { msg: '使用者不存在' };
    }
    ctx.status = resultStatus;

    ctx.body = resultBody;
  }

  //註冊帳號
  async register() {
    const { ctx } = this;
    let resultStatus = 200;
    let resultBody = { msg: '註冊成功，跳轉至登入頁面' };

    //驗證帳密
    const rules = {
      username: { type: 'string', required: true, allowEmpty: false },
      password: { type: 'string', required: true, min: 4, max: 20 }
    }
    ctx.validate(rules, ctx.request.body);

    const { username, password } = ctx.request.body;
    const [user, created] = await ctx.model.User.findOrCreate({
      where: { username },
      defaults: { password: await crypto.encryptPassword(password), point: 5 },
    });

    //重複使用者
    if (created === false) {
      resultStatus = 409;
      resultBody = { msg: '使用者已存在' };
    }

    ctx.status = resultStatus;

    ctx.body = resultBody;
  }

  //登出
  async logout() {
    const { ctx } = this;
    ctx.session = null;
    ctx.status = 200;

    ctx.body = { msg: '已登出' };
  }

  //目前session登入資訊
  async loginInfo() {
    const { ctx } = this;
    const userId = ctx.session.user.id;
    const userData = await ctx.model.User.findOne({
      where: { id: userId },
      attributes: ['id', 'username', 'point'],
    });
    ctx.status = 200;
    
    ctx.body = userData;
  }
}

module.exports = LoginController;
