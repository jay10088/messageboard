/* eslint valid-jsdoc: "off" */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = appInfo => {
  const config = {};

  config.keys = appInfo.name + '_' + process.env.SECRET_KEY;
  config.proxy = true;

  config.cluster = {
    listen: {
      port: process.env.PORT,
      hostname: '0.0.0.0',
    },
  };

  config.security = {
    csrf: { enable: false },
  };

  config.validate = {
    convert: true,
    widelyUndefined: true,
  };

  config.sequelize = {
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    timezone: '+08:00',
    define: {
      timestamps: false,
      freezeTableName: true,
    },
  };

  config.redis = {
    client: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      db: 0,
    },
  };

  config.session = {
    key: 'EGG_SESS',
    maxAge: 24 * 3600 * 1000, // 24小時
    httpOnly: true,
    encrypt: true,
    renew: true,
  };

  config.middleware = [];

  const userConfig = {};

  return { ...config, ...userConfig };
};
