'use strict'
const path = require('path');
const rules = require(path.join( __dirname , '../validator/rules'));
const crypto = require(path.join(__dirname , '../lib/crypto'));

const Controller = require('egg').Controller;

class loginController extends Controller {
    
    async login(){
        const { ctx } = this;
        let resultStatus = 200;
        let resultBody = { msg: '更新成功'};
        let correctUser = false;

        try{
            ctx.validate(rules.accountRule, ctx.request.body);
            const { username, password } = ctx.request.body;

            const user = await ctx.model.User.findOne({
                where: { username },
                attributes: ['id', 'username', 'password']
            });

            //無使用者
            if (!user) {
                resultStatus = 400;
                resultBody = { msg: '使用者不存在' };
            }
            else {
                const isMatch = await crypto.verifyPassword(password, user.password);
                if (!isMatch) {
                    resultStatus = 400;
                    resultBody = { msg: '密碼錯誤' };
                }
                else {
                    correctUser = true;
                    ctx.session.user = { id: user.id, username: user.username };
                }
            }

            if (correctUser) {
                ctx.status = 200;
                
                ctx.body = { msg: '登入成功', user: ctx.session.user };
            }
            else {
                ctx.status = resultStatus;

                ctx.body = resultBody;
            }
        } 
        catch(err) {
            if (err.name === 'UnprocessableEntityError') {
                ctx.status = 422;

                ctx.body = { msg: '帳號或密碼格式錯誤' };
            }
        }
    }
    //註冊
    async register(){
        const { ctx } = this;
        let resultStatus = 200;
        let resultBody = { msg: '註冊成功，跳轉至登入頁面'};

        try{
            ctx.validate(rules.accountRule, ctx.request.body);

            const { username, password } = ctx.request.body;
            const [user, created] = await ctx.model.User.findOrCreate({
                where: { username },
                defaults: { password: await crypto.encryptPassword(password) , value: 5},
            });

            //重複使用者
            if (!created) {
                resultStatus = 409;
                resultBody = { msg: '使用者已存在' };
            }

            ctx.status = resultStatus;

            ctx.body = resultBody;
        }
        catch(err){
            if (err.name === 'UnprocessableEntityError') {
                ctx.status = 422;

                ctx.body = { msg: '帳號或密碼格式錯誤' };
            }
        }
    }

    //登出
    async logout() {
        const { ctx } = this;

        if (!ctx.session.user) {
            ctx.status = 401;

            ctx.body = { msg: '你未登入' };
        }
        else {
            ctx.session = null;
            ctx.status = 200;

            ctx.body = { msg: '已登出' };
        }
    }

    //資訊
    async loginInfo() {
        const { ctx } = this;
        const userId = ctx.session.user.id
        if (!userId) {
            ctx.status = 401;
        }
        else {
            const userData = await ctx.model.User.findOne({
                where: { id: userId },
                attributes: ['id', 'username', 'value'],
            });
            ctx.status = 200;

            ctx.body = userData;
        }
    }
}

module.exports = loginController;