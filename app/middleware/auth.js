module.exports = () => {
  return async function auth(ctx, next) {
    if (!ctx.session?.user) {
      ctx.status = 401;
      ctx.body = { msg: '未登入或登入已失效' };
      return;
    }
    ctx.user = ctx.session.user;
    await next();
  };
};
