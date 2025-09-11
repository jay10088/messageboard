const Service = require('egg').Service;

class CacheService extends Service {

  // 用戶相關功能

  //清除使用者cache
  async clearUserCache(username) {
    const userCache = 'user:' + username;
    await this.app.redis.del(userCache);
  }
  
  //獲取特定用戶cache資訊
  async getUserCache(username) {
    const userCache = 'user:' + username;
    const cachedData = await this.app.redis.get(userCache);
    
    return cachedData ? JSON.parse(cachedData) : null;
  }
  
  //設置用戶cache
  async setUserCache(username, userData) {
    const userCache = 'user:' + username;
    await this.app.redis.setex(userCache, 1800, JSON.stringify(userData));
  }

  //===============
  // 點數相關功能

  //清除點數cache
  async clearPointCache(username) {
    const pointCache = 'pointHistory:' + username;
    await this.app.redis.del(pointCache);
    await this.app.redis.del('pointHistory:latest');
  }
  
  //獲取點數歷史
  async getPointHistoryCache() {
    const cachedData = await this.app.redis.get('pointHistory:latest');
    
    return cachedData ? JSON.parse(cachedData) : null;
  }

  //獲取特定用戶歷史
  async getUserPointHistoryCache(username) {
    const pointCache = 'pointHisory:' + username;
    const cachedData = await this.app.redis.get(pointCache);

    return cachedData ? JSON.parse(cachedData) : null;
  }
  
  //將更動歷史寫入cache
  async setPointHistoryCache(data) {
    await this.app.redis.setex('pointHistory:latest', 30, JSON.stringify(data));
  }

  //將特定用戶更動歷史寫入cache
  async setUserPointHistoryCache(username, data) {
    const pointCache = 'pointHistory:' + username;
    await this.app.redis.setex(pointCache, 30, JSON.stringify(data));
  }

  //===============
  // 留言相關功能

  //清除留言cache
  async clearMessageCache() {
    await this.app.redis.del('messageHistory:latest');
  }
  
  //獲取留言歷史
  async getMessageHistoryCache() {
    const cachedData = await this.app.redis.get('messageHistory:latest');
    
    return cachedData ? JSON.parse(cachedData) : null;
  }
  
  //將更動歷史寫入cache
  async setMessageHistoryCache(data) {
    await this.app.redis.setex('messageHistory:latest', 30, JSON.stringify(data));
  }

}

module.exports = CacheService;
