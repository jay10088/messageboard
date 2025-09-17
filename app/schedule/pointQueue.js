'use strict';

const Subscription = require('egg').Subscription;

class PointQueueSchedule extends Subscription {
  static get schedule() {
    return {
      interval: '10s',      
      type: 'all',      
      immediate: true,
    };
  }

  async subscribe() {
    const queueLength = await this.app.redis.llen('dataQueue');
    
    if (queueLength > 0) {
      await this.ctx.service.point.processRedisDataQueue();
    }
  }
}

module.exports = PointQueueSchedule;
