module.exports = (requiredRoles = []) => {

  //數字越高，權限越高
  const roleHierarchy = {
    user: 1,
    staff: 2,
    admin: 3
  };

  return async function roleAuth(ctx, next) {

      // 檢查使用者權限
      const userRole = ctx.session.user.role;
      const userLevel = roleHierarchy[userRole];
      const hasPermission = requiredRoles.some(role => userLevel >= roleHierarchy[role]);
      
      //有權限才放行
      if (hasPermission) {

        await next();
      } else {
        ctx.status = 400;

        ctx.body = { msg: '沒有權限' };
      }
    }
  };
