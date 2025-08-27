module.exports = () => {
  return async function auth(ctx, next) {
    if (ctx.session.user) {
      await next();
    } else {
      ctx.status = 401;
      ctx.body = { msg: '未登入' };
    }
  };
};
