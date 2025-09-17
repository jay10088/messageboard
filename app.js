'use strict';

const fs = require('fs');
const path = require('path');

module.exports = app => {
  app.beforeStart(async () => {
    try {
      await loadLuaScript(app);
    } catch (error) {
      throw new Error(`lua腳本載入失敗: ${error.message}`);
    }
  });
};

async function loadLuaScript(app) {
  const modifyPointScript = fs.readFileSync(path.join(app.baseDir, 'app/lua/modifyPoint.lua'), 'utf8');
  const fetchQueueScript = fs.readFileSync(path.join(app.baseDir, 'app/lua/fetchQueue.lua'), 'utf8');

  app.redisScript = {
    modifyPointSha: await app.redis.script('LOAD', modifyPointScript),
    fetchQueueSha: await app.redis.script('LOAD', fetchQueueScript),
  };
}
