/* eslint valid-jsdoc: "off" */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = appInfo => {
  const config = {};

  config.keys = appInfo.name + '_1001';
  config.proxy = true;

  config.cluster = {
  listen: {
    port: process.env.PORT || 7001,
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

  config.middleware = [];

  const userConfig = {};

  return { ...config, ...userConfig };
};
