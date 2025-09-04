'use strict';

module.exports = app => {
  const { STRING, INTEGER, ENUM } = app.Sequelize;

  const User = app.model.define('user', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: STRING(20), allowNull: false, unique: true },
    password: { type: STRING(60), allowNull: false },
    point: { type: INTEGER , allowNull: false },
    role: { type: ENUM('admin', 'staff', 'user'), allowNull: false, defaultValue: 'user'},
  } , {
    tableName: 'user',
    timestamps: false,
    freezeTableName: true
  });

  return User;
};
