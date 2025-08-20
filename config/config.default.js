/* eslint valid-jsdoc: "off" */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1001';

  config.security = {
    csrf: { enable: false },
  };

  config.validate = {
    convert: true,
    widelyUndefined :true,
  };

  config.sequelize = {
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,     
  password: process.env.DB_PASS,
  timezone: '+08:00',
  define:{
    timestamps: false ,
    freezeTableName: true
    }
  };

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
