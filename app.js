'use strict';

module.exports = app => {
  app.beforeStart(async () => {
    processPointQueue(app);
  });
};

function processPointQueue(app) {
  const processQueue = async () => {
    try {
      const ctx = app.createAnonymousContext();
      const count = await ctx.service.point.processPointQueue();
      
      if (count > 0) {
        console.log(`處理了 ${count} 筆點數記錄`);
      }
    } catch (error) {
      console.error('處理點數失敗:', error);
    }
  };

  setInterval(processQueue, 30000);
  
  processQueue();
}

