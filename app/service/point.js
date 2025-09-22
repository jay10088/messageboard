'use strict';

const Service = require('egg').Service;

class PointService extends Service {

  async modifyPoint(username, amount, reason = 'modify') {
    try {
      const script = `
        local userKey = KEYS[1]
        local amount = tonumber(ARGV[1])
        local currentPoint = tonumber(redis.call('GET', userKey))
        local newPoint = -1
        
        if currentPoint + amount >= 0 then
          newPoint = currentPoint + amount
          redis.call('SET', userKey, newPoint)
          
          local queueData =
            string.format('{"operation":"modifyPoint","username":"%s",', ARGV[2]) ..
            string.format('"amount":%d,"oldPoint":%d,"newPoint":%d,', amount, currentPoint, newPoint) ..
            string.format('"reason":"%s","content":"","timestamp":%s}', ARGV[3], ARGV[4])
          
          redis.call('LPUSH', 'pointQueue', queueData)
        end
        
        return {newPoint, currentPoint}
      `;
      
      const userKey = `user:${username}:point`;
      await this.getUserPoint(username);

      const result = await this.app.redis.eval(
        script, 
        1,
        userKey,
        amount,
        username,
        reason,
        Date.now()
      );

      if (result[0] === -1) {
        throw new Error('點數不足');
      }

    } catch (error) {
      throw new Error(`點數更改失敗: ${error.message}`);
    }
  }

  async createMessageWithPoint(username, content, reason = 'COMMENT') {
    try {
      const script = `
        local userKey = KEYS[1]
        local content = ARGV[1]
        local newPoint = -1
        local currentPoint = tonumber(redis.call('GET', userKey))
        
        if currentPoint >= 1 then
          newPoint = currentPoint - 1
          redis.call('SET', userKey, newPoint)
          redis.call('LPUSH', 'messageBoard', content)
          
          local queueData = 
            string.format('{"operation":"comment","username":"%s",', ARGV[2]) ..
            string.format('"amount":-1,"oldPoint":%d,"newPoint":%d,', currentPoint, newPoint) ..
            string.format('"reason":"%s","content":"%s","timestamp":%s}', ARGV[3], content, ARGV[4])
          
          redis.call('LPUSH', 'pointQueue', queueData)
        end

        return {newPoint, currentPoint}
      `;

      const userKey = `user:${username}:point`;
      await this.getUserPoint(username);
      
      const result = await this.app.redis.eval(
        script, 
        1, 
        userKey,
        content,
        username,
        reason,
        Date.now()
      );

      if (result[0] === -1) {
        throw new Error('點數不足');
      }

    } catch (error) {
      throw new Error(`留言失敗: ${error.message}`);
    }
  }

  //處理點數queue
  async processPointQueue(maxSize = 500) {
    const records = [];
    
    //取出點數記錄 maxSize用來防止資料多到無法出去迴圈
    for (let i = 0; i < maxSize; i++) {
      const record = await this.app.redis.rpop('pointQueue');
      if (!record) break;
      records.push(JSON.parse(record));
    }

    //處理點數記錄
    for (const record of records) {
      let transaction;

      try {
        const delta = record.newPoint - record.oldPoint;
        transaction = await this.app.model.transaction();

        if (record.operation === 'comment') {
          await this.app.model.Message.create({
            content: record.content,
            username: record.username,
            created_at: new Date(record.timestamp)
          }, { transaction });
        }
        
        await this.app.model.User.update(
          { point: record.newPoint },
          {
            where: { username: record.username },
            transaction
          }
        );

        await this.app.model.Point.create({
          username: record.username,
          delta: delta,
          pointBefore: record.oldPoint,
          pointAfter: record.newPoint,
          reason: record.reason,
          created_at: new Date(record.timestamp),
        }, { transaction } );

        await transaction.commit();
        
      } catch (error) {
        if (transaction) {
          await transaction.rollback();
        }

        //失敗的話重新排隊
        await this.app.redis.lpush('pointQueue', JSON.stringify(record));
      }
    }

    return records.length;
  }

  async getUserPoint(username) {
    const userKey = `user:${username}:point`;
    let point = await this.app.redis.get(userKey);
    
    if (point === null) {
      const lockKey = `lock:getUserPoint:${username}`;
      
      const lockAcquired = await this.app.redis.set(lockKey, '1', 'PX', 5000, 'NX');
      
      if (lockAcquired) {
        try {
          point = await this.app.redis.get(userKey);
          
          if (point === null) {
            const user = await this.app.model.User.findOne({
              where: { username },
              attributes: ['point']
            });
            
            if (user) {
              point = user.point;
              await this.app.redis.setex(userKey, 1800, point);
            } else {
              throw new Error('無使用者');
            }
          }
        } finally {
          await this.app.redis.del(lockKey);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 50));
        return this.getUserPoint(username);
      }
    }
    
    return parseInt(point, 10);
  }
}

module.exports = PointService;
