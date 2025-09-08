/** @type Egg.EggPlugin */
module.exports = {

  sequelize : {
  enable: true,
  package: 'egg-sequelize'
},

  assets : {
    enable: false,
    package: 'egg-view-assets'
  },

  dotenv: {
    enable: true,
    package: 'egg-dotenv',
  },

  validate: {
  enable: true,
  package: 'egg-validate',
},

  redis: {
    enable: true,
    package: 'egg-redis',
  },

  sessionRedis: {
  enable: true,
  package: 'egg-session-redis',
  },

};
