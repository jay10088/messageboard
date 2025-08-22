'use strict';

module.exports = app => {
  const { STRING, INTEGER } = app.Sequelize;

  const User = app.model.define('user', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: STRING(20), allowNull: false, unique: true },
    password: { type: STRING(60), allowNull: false },
  } , {
    tableName: 'users',
    timestamps: false,
  });

  

  return User;
};
