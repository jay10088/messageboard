module.exports = () => {
  return async function loginAuth(ctx, next) {
    if (ctx.session.user) {

      await next(); //進到下一個middleware或存取api
    } else {
      ctx.status = 401;

      ctx.body = { msg: '未登入' };
    }
  };
};
