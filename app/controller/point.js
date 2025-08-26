'use strict'
const path = require('path');
const rules = require(path.join( __dirname , '../validator/rules'));

const Controller = require('egg').Controller;

class valueController extends Controller {
    async addValue() {
        try{
            const { ctx } = this;
            const returnStatus = 200;
            const returnBody = { msg: '儲值成功' };
            ctx.validate(rules.pointRule, ctx.request.body);

            const { point } = ctx.request.body;
            
            if (!ctx.session.user) {
                returnStatus = 400;
                returnBody = { msg: '未登入' };
            }
            else {
                const userId = ctx.session.user.id;
                await ctx.model.User.increment('value', {
                    by: point,
                    where: { id: userId },
                });
            }

            ctx.status = returnStatus;
            ctx.body = returnBody;
        }
        catch (err) {
            if (err.name === 'UnprocessableEntityError') {
                ctx.status = 422;

                ctx.body = { msg: '只可以輸入數字' };
            }
        }
        
    }

}

module.exports = valueController;