'use strict'
const path = require('path');
const crypto = require(path.join(__dirname , '../lib/crypto'));

const Controller = require('egg').Controller;

class LoginController extends Controller {
    
  //登入
  async login() {
    const { ctx, app } = this;
    let resultStatus = 200;
    let resultBody = { msg: '登入成功'};

    //驗證帳密
    const rules = {
      username: { type: 'string', required: true, allowEmpty: false },
      password: { type: 'string', required: true, min: 4, max: 20 }
    }
    ctx.validate(rules, ctx.request.body);
    
    const { username, password } = ctx.request.body;

    //先去redis找資料
    let user = await ctx.service.cache.getUserCache(username);

    //如果redis沒資料才從sql找
    if (!user) {
    user = await ctx.model.User.findOne({
      where: { username },
      attributes: ['id', 'username', 'password', 'role', 'point']
    });
    //有找到寫入redis
    if (user) {
      await ctx.service.cache.setUserCache(username, user);
    }
  }

    //判斷是否存在使用者/密碼
    if (user) {
      const isMatch = await crypto.verifyPassword(password, user.password);
      //密碼正確
      if (isMatch) {
        ctx.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          point: user.point,
        };
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
    const { ctx, app } = this;
    let resultStatus = 200;
    let resultBody = { msg: '註冊成功，跳轉至登入頁面' };
    let newUser, created;

    //驗證帳密
    const rules = {
      username: { type: 'string', required: true, allowEmpty: false },
      password: { type: 'string', required: true, min: 4, max: 20 }
    }
    ctx.validate(rules, ctx.request.body);
    const { username, password } = ctx.request.body;
    //先去redis找資料
    const cachedUser = await ctx.service.cache.getUserCache(username);

    if (cachedUser) {
      created = false;
    } else {
      const hashedPassword = await crypto.encryptPassword(password);
      [newUser, created] = await ctx.model.User.findOrCreate({
      where: { username },
      defaults: { password: hashedPassword, point: 5 },
      });
      //有找到寫入redis
      if (newUser) {
        await ctx.service.cache.setUserCache(username, newUser);
      }
    }

    //重複使用者
    if (created === false) {
      resultStatus = 400;
      resultBody = { msg: '使用者已存在' };
    }

    ctx.status = resultStatus;

    ctx.body = resultBody;
  }

  //登出
  async logout() {
    const { ctx } = this;
    const username = ctx.session.user.username;
    
    await ctx.service.cache.clearUserCache(username);
    ctx.session = null;
    ctx.status = 200;

    ctx.body = { msg: '已登出' };
  }

  //找尋目前使用者
  async findmyInfo() {
    const { ctx, app } = this;
    let returnStatus = 200;
    let userData;

    if (ctx.session.user) {
      const username = ctx.session.user.username;
      userData = await ctx.service.cache.getUserCache(username);

      //如果redis沒資料去sql
      if (!userData) {
        userData = await ctx.model.User.findOne({
        where: { username },
        attributes: ['id', 'username', 'point', 'role'],
        });
        //有找到寫入redis
        if (userData) {
          await ctx.service.cache.setUserCache(username, userData);
        }
      }
    } else {
      //未登入時回傳空用戶
      userData = { id: null, username: '', point: 0, role: '' };
      returnStatus = 400;
    }
    ctx.status = returnStatus;

    ctx.body = userData;
  }

  //找使用者登入資訊
  async findUserInfo() {
    const { ctx } = this;
    
    //驗證
    const rules = {
      username: { type: 'string', required: true, allowEmpty: false },
    }
    ctx.validate(rules, ctx.params);
    
    const { username } = ctx.params;
    
    let userData = await ctx.service.cache.getUserCache(username);
    
    //如果redis沒有資料
    if (!userData) {
      //redis找不到才去sql
      userData = await ctx.model.User.findOne({
        where: { username },
        attributes: ['id', 'username', 'point', 'role'],
      });
      //有找到寫入redis
      if (userData) {
        await ctx.service.cache.setUserCache(username, userData);
      }
    }
    
    ctx.body = userData;
  }
}
module.exports = LoginController;
