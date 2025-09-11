'use strict';

const Service = require('egg').Service;

class PointService extends Service {
  
  async acquireLock(username, timeout = 10000) {
    const lockKey = `point_lock:${username}`;
    
    try {
      const lock = await this.app.redlock.acquire([lockKey], timeout);
      return lock;
    } catch (error) {
      throw new Error('無法獲取鎖，請稍後再試');
    }
  }

  //讀取資料庫資料並鎖起
  async lockAndGetUserPoint(username, transaction) {
    const user = await this.app.model.User.findOne({
      where: { username },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    return user.point;
  }

  //檢查資料一致性
  async verifyDataConsistency(username) {
    const redisP = await this.app.redis.get(`user:${username}:point`);
    const dbUser = await this.app.model.User.findOne({
      where: { username },
      attributes: ['point']
    });
    
    const dbPoint = dbUser.point;
    const redisPoint = parseInt(redisP);
    
    //檢查Redis和資料庫是否一致，不一致的話redis可能有問題
    if (redisPoint !== dbPoint) {
      await this.app.redis.setex(`user:${username}:point`, 1800, dbPoint);
      this.logger.error('錯誤，redis與資料庫不一致');
    }
  }

  //更新資料庫
  async updateUserPoint(username, oldPoint, newPoint, delta, reason, transaction) {

    await this.app.model.User.update(
      { point: newPoint },
      {
        where: { username },
        transaction
      }
    );

    //記錄點數變動/原因
    await this.app.model.Point.create({
      username: username,
      delta: delta,
      reason: reason,
      pointBefore: oldPoint,
      pointAfter: newPoint,
    }, {
      transaction
    });
  }

  //更新redis快取
  async updatePointCache(username, newPoint) {

    //更新快取
    await this.ctx.service.cache.clearUserCache(username);
    await this.app.redis.setex(`user:${username}:point`, 1800, newPoint);

    //更新 Session（如果是當前用戶）
    if (this.ctx.session.user && this.ctx.session.user.username === username) {
      this.ctx.session.user.point = newPoint;
    }
  }

  // 儲值
  async topupPoint(username, amount, reason = 'TOP_UP') {

    const lock = await this.acquireLock(username);
    let transaction;
    
    try {
      transaction = await this.app.model.transaction();
      
      //鎖住用戶記錄並獲取目前點數
      const currentPoint = await this.lockAndGetUserPoint(username, transaction);
      const newPoint = currentPoint + amount;
      
      //更新用戶點數並寫紀錄
      await this.updateUserPoint(username, currentPoint, newPoint, amount, reason, transaction);
      
      //交易正常的話commit
      await transaction.commit();

      //更新redis
      await this.updatePointCache(username, newPoint);
      
      //檢查資料一致性
      await this.verifyDataConsistency(username);
      
    } catch (error) {   
      if (transaction) {
        await transaction.rollback();
      }
      throw new Error(`儲值失敗: ${error.message}`);
    } finally {
      await lock.release();
    }
  }

  //使用點數
  async usePoint(username, amount, reason = 'USE_POINT') {

    const lock = await this.acquireLock(username);
    let transaction;
      
    try {
      transaction = await this.app.model.transaction();

      //鎖住用戶記錄並獲取目前點數
      const currentPoint = await this.lockAndGetUserPoint(username, transaction);
      
      if (currentPoint < amount) {
        throw new Error('點數不足');
      }
      
      const newPoint = currentPoint - amount;
      
      //更新用戶點數並寫紀錄
      await this.updateUserPoint(username, currentPoint, newPoint, -amount, reason, transaction);
      
      await transaction.commit();

      //更新redis
      await this.updatePointCache(username, newPoint);
      
      //檢查資料一致性
      await this.verifyDataConsistency(username);
      
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw new Error(`使用點數失敗: ${error.message}`);
    } finally {
      await lock.release();
    }
  }

  //留言並消耗點數
  async createMessageWithPoint(username, content, reason = 'COMMENT') {

    const lock = await this.acquireLock(username);
    let transaction;
    
    try {
      transaction = await this.app.model.transaction();
      
      //鎖住用戶記錄並獲取目前點數
      const currentPoint = await this.lockAndGetUserPoint(username, transaction);
      
      if (currentPoint <= 0) {
        throw new Error('點數不足');
      }
      
      //寫入留言（原子操作）
      await this.app.model.Message.create( { content, username }, { transaction } );     
      const newPoint = currentPoint - 1;
      
      //更新用戶點數並寫紀錄
      await this.updateUserPoint(username, currentPoint, newPoint, -1, reason, transaction);
      
      await transaction.commit();

      //更新redis
      await this.updatePointCache(username, newPoint);

      //檢查資料一致性
      await this.verifyDataConsistency(username);
      
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw new Error(`留言失敗（未消耗點數）: ${error.message}`);
    } finally {
      await lock.release();
    }
  }
}

module.exports = PointService;
