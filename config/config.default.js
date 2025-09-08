/* eslint valid-jsdoc: "off" */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = appInfo => {
  const config = {};
  
  config.keys = appInfo.name + '_' + (process.env.SECRET_KEY || 'fallback_secret');
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
  
  // MySQL 配置
  config.sequelize = {
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    timezone: '+08:00',
    define: {
      timestamps: false,
      freezeTableName: true,
    },
  };
  
  // Redis 配置 - 支援本地和 Railway
  const configureRedis = () => {
    // 檢查是否在 Railway 環境
    const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production';
    
    console.log('🔍 Redis 配置檢查:');
    console.log('環境:', isRailway ? 'Railway' : '本地開發');
    
    if (isRailway) {
      // Railway 環境 - 使用分別參數
      const redisHost = process.env.REDIS_HOST;
      const redisPort = process.env.REDIS_PORT;
      const redisPassword = process.env.REDIS_PASSWORD;
      
      console.log('Railway Redis 環境變數:');
      console.log('REDIS_HOST:', redisHost || '未設定');
      console.log('REDIS_PORT:', redisPort || '未設定');
      console.log('REDIS_PASSWORD:', redisPassword ? '已設定' : '未設定');
      
      if (redisHost && redisPort) {
        const config = {
          host: redisHost,
          port: parseInt(redisPort),
          password: redisPassword || '',
          db: 0,
          connectTimeout: 15000,
          commandTimeout: 8000,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        };
        
        console.log('✅ Railway Redis 配置完成');
        return config;
      } else {
        console.log('❌ Railway Redis 環境變數不完整');
        return null;
      }
    } else {
      // 本地環境 - 可以用 URL 或分別參數
      if (process.env.REDIS_URL) {
        try {
          const url = new URL(process.env.REDIS_URL);
          const config = {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            password: url.password || '',
            db: 0,
          };
          
          console.log('✅ 本地 Redis (從 URL 解析) 配置完成');
          return config;
        } catch (error) {
          console.log('❌ 本地 REDIS_URL 解析失敗:', error.message);
        }
      }
      
      // 本地備用配置
      const config = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: 0,
      };
      
      console.log('✅ 本地 Redis 備用配置');
      return config;
    }
  };
  
  const redisConfig = configureRedis();
  
  if (redisConfig) {
    config.redis = {
      client: redisConfig,
    };
    
    config.session = {
      key: 'EGG_SESS',
      maxAge: 24 * 3600 * 1000,
      httpOnly: true,
      encrypt: true,
      renew: true,
      secure: process.env.NODE_ENV === 'production',
      store: 'redis',
    };
    
    console.log('✅ Redis 和 Session 配置完成');
  } else {
    // Redis 不可用時的降級配置
    console.log('⚠️ Redis 不可用，使用內存 Session');
    
    config.session = {
      key: 'EGG_SESS',
      maxAge: 24 * 3600 * 1000,
      httpOnly: true,
      encrypt: true,
      renew: true,
      secure: process.env.NODE_ENV === 'production',
      // 不指定 store，使用內存存儲
    };
  }
  
  config.middleware = [];
  
  return config;
};