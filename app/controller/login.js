const path = require('path');
const rules = require(path.join( __dirname , '../validate/rules'));
const bcrypt = require('bcryptjs');

const Controller = require('egg').Controller;

class loginController extends Controller {

        async encryptPassword(plain) {

            return bcrypt.hash(plain, 10);
        }

        async verifyPassword(plain, cipher) {

            return bcrypt.compare(plain, cipher);
        }
    
        async login(){
            const { ctx } = this;

            try{
                ctx.validate(rules.accountRule, ctx.request.body);
                const { username, password } = ctx.request.body;
                const user = await ctx.model.User.findOne({
                    where: { username },
                    attributes: ['id', 'username', 'password']
                });            

                //無使用者
                if (!user) {
                    ctx.status = 400;
                    ctx.body = { msg: '使用者不存在' };

                    return;
                }

                //密碼驗證
                const successLogin = await bcrypt.compare(password, user.password);
                if (!successLogin) {
                    ctx.status = 400;
                    ctx.body = { msg: '密碼錯誤' };

                    return;
                }

                //登入成功
                ctx.status = 200;
                ctx.session.user = { id: user.id, username: user.username };

                ctx.body = { 
                    msg: '登入成功',
                    user: ctx.session.user,
                };
            } 
            catch(err) {
                if (err.name === 'UnprocessableEntityError') {
                    ctx.status = 422;
                    ctx.body = { msg: '帳號或密碼格式錯誤' }
                }
            }
        }

        async register(){
            const { ctx } = this;

            try{
                ctx.validate(rules.accountRule, ctx.request.body);
                const { username, password } = ctx.request.body;
                const [user, created] = await ctx.model.User.findOrCreate({
                    where: { username },
                    defaults: { password: await this.encryptPassword(password) },
                });

                //重複使用者
                if (!created) {
                    ctx.status = 409;
                    ctx.body = { msg: '使用者已存在' };

                    return;
                }

                ctx.status = 201;

                ctx.body = { msg: '註冊成功！即將跳轉登入頁面' };
            }
            catch(err){
                if (err.name === 'UnprocessableEntityError') {
                    ctx.status = 422;
                    ctx.body = { msg: '帳號或密碼格式錯誤' }
                }
            }
        }

        async logout() {
            const { ctx } = this;

            if (!ctx.session.user) {
                ctx.status = 401;
                ctx.body = { msg: '你未登入' };

                return;
            }


            ctx.session = null;
            ctx.status = 200;

            ctx.body = { msg: '已登出' };
        }

    }

module.exports = loginController;