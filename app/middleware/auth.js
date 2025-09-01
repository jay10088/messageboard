module.exports = (requiredRoles = []) => {
  //數字越高，權限越高
  const roleHierarchy = {
    user: 1,
    staff: 2,
    admin: 3
  };

  return async function auth(ctx, next) {
    let returnStatus = 400;
    let returnBody = { msg: '未登入' };
    // 檢查是否已登入
    if (ctx.session.user) {
      const user = ctx.session.user;
      const userRole = user.role;
      // 檢查使用者權限
      const userLevel = roleHierarchy[userRole];
      const hasPermission = requiredRoles.some(role => userLevel >= roleHierarchy[role]);
      //有權限才放行
      if (hasPermission) {
        returnStatus = 200;
        returnBody = { msg: '' };
        await next();
      } else {
        returnStatus = 400;
        returnBody = { msg: '權限不足' };
      }
    }

    ctx.status = returnStatus;

    ctx.body = returnBody;
  };
};
