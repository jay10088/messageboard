'use strict';

const Service = require('egg').Service;

class PointService extends Service {

  //修改點數（當扣點時amount為負數）
  async modifyPoint(username, amount, reason = 'modify', operation = 'modifyPoint', extraData = {}) {
    try {
      const userKey = `user:${username}:point`;
      const queueKey = 'dataQueue';

      //準備傳入lua腳本的參數
      const queueData = {
        username,
        amount,
        reason,
        operation,
        extraData,
        timestamp: Date.now(),
      };
      const queueDataJSON = JSON.stringify(queueData);

      //使用lua script修改點數並記錄
      const result = await this.app.redis.evalsha(
        this.app.redisScript.modifyPointSha,
        2,
        userKey,
        queueKey,
        queueDataJSON
      );

      if (result[0] === -1) {
        throw new Error('點數不足');
      }

      //更新session資訊（如果是當前使用者）
      if (this.ctx.session.user && this.ctx.session.user.username === username) {
        this.ctx.session.user.point = result[0];
      }

      return {
        newPoint: result[0],
        oldPoint: result[1]
      };

    } catch (error) {
      throw new Error(`點數更改失敗: ${error.message}`);
    }
  }

  async createMessageWithPoint(username, content, reason = 'COMMENT') {
    try {
      await this.modifyPoint(username, -1, reason, 'comment', {
        content: content
      });
      await this.app.redis.lpush('messageBoard', content);

    } catch (error) {
      throw new Error(`留言失敗: ${error.message}`);
    }
  }

  async processRedisDataQueue(maxSize = 200) {

    const queueKey = 'dataQueue';
    const records = fetchQueueRecord(queueKey, maxSize);

    const message = [];
    const pointRecord = [];
    const userPointUpdate = new Map();

    for (const record of records) {
      if (record.operation === 'comment') {
        message.push({
          username: record.username,
          content: record.extraData.content,
        });
      }

      userPointUpdate.set(record.username, record.newPoint);

      pointRecord.push({
        username: record.username,
        delta: record.amount,
        pointBefore: record.oldPoint,
        pointAfter: record.newPoint,
        reason: record.reason,
        created_at: new Date(record.timestamp),
      });
    }

    const transaction = await this.app.model.transaction();
    try {
      await this.saveMessage(message, transaction);
      await this.saveUserPoint(userPointUpdate, transaction);
      await this.savePointRecord(pointRecord, transaction);

      await transaction.commit();

      return records.length;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`資料庫操作失敗: ${error.message}`);
    }
  }

  async fetchQueueRecord(queueKey, maxSize) {
    const rawRecord = await this.app.redis.evalsha(
      this.app.redisScript.fetchQueueSha,
      1,
      queueKey,
      maxSize
    );
    
    return rawRecord.map(r => JSON.parse(r));
  }

  async saveMessage(message, transaction) {
    if (message.length > 0) {
      await this.app.model.Message.bulkCreate(message, { transaction });
    }
  }

  async saveUserPoint(userPointUpdate, transaction) {
    const userUpdateData = Array.from(userPointUpdate, ([username, point]) => ({
      username,
      point,
    }));

    if (userUpdateData.length > 0) {
      await this.app.model.User.bulkCreate(userUpdateData, {
        updateOnDuplicate: ['point'],
        transaction,
      });
    }
  }

  async savePointRecord(pointRecord, transaction) {
    if (pointRecord.length > 0) {
      await this.app.model.Point.bulkCreate(pointRecord, { transaction });
    }
  }

  async getUserPoint(username) {
    const userKey = `user:${username}:point`;
    let point = await this.app.redis.get(userKey);

    return parseInt(point, 10);
  }
}

module.exports = PointService;
