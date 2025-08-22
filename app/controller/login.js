const path = require('path');
const rules = require(path.join( __dirname , '../validate/rules'));
const bcrypt = require('bcryptjs');

const Controller = require('egg').Controller;

class loginController extends Controller {

    //加密密碼
    async encryptPassword(plain) {

        return bcrypt.hash(plain, 10);
    }

    //判斷正確密碼
    async verifyPassword(plain, cipher) {

        return bcrypt.compare(plain, cipher);
    }
    
    async login(){
        const { ctx } = this;

        let resultStatus = 200;
        let resultBody = { ok: true , msg: '更新成功'};
        let correctUser = false;

        try{
            ctx.validate(rules.accountRule, ctx.request.body);
            const { username, password } = ctx.request.body;
            const user = await ctx.model.User.findOne({
                where: { username },
                attributes: ['id', 'username', 'password']
            });
            const isMatch = await bcrypt.compare(password, user.password);

            //無使用者
            if (!user) {
                resultStatus = 400;
                resultBody = { ok: false  , msg: '使用者不存在' };
            }
            //密碼驗證
            else if (!isMatch) {
                resultStatus = 400;
                resultBody = { ok: false  , msg: '密碼錯誤' };
            }
            else {
                correctUser = true;
                ctx.status = 200;
                ctx.session.user = { id: user.id, username: user.username };

                ctx.body = { ok: true , msg: '登入成功', user: ctx.session.user };
            };

            if (!correctUser) {
                ctx.status = resultStatus;

                ctx.body = resultBody;
            }
        } 
        catch(err) {
            if (err.name === 'UnprocessableEntityError') {
                ctx.status = 422;
                ctx.body = { ok:false , msg: '帳號或密碼格式錯誤' }
            }
        }
    }
    //註冊
    async register(){
        const { ctx } = this;

        try{
            ctx.validate(rules.accountRule, ctx.request.body);
            let resultStatus = 200;
            let resultBody = { ok: true , msg: '註冊成功，跳轉至登入頁面'};

            const { username, password } = ctx.request.body;
            const [user, created] = await ctx.model.User.findOrCreate({
                where: { username },
                defaults: { password: await this.encryptPassword(password) },
            });

            //重複使用者
            if (!created) {
                resultStatus = 409;
                resultBody = { ok: false , msg: '使用者已存在' };
            }

            ctx.status = resultStatus;

            ctx.body = resultBody;
        }
        catch(err){
            if (err.name === 'UnprocessableEntityError') {
                ctx.status = 422;

                ctx.body = { ok:false , msg: '帳號或密碼格式錯誤' }
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
}

module.exports = loginController;