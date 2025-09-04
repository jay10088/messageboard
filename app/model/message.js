'use strict';

module.exports = app => {
  const { INTEGER, TEXT } = app.Sequelize;

  const Message = app.model.define('message', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    content: { type: TEXT, allowNull: false },
    username: { type: TEXT, allowNull: false },
  }, 
  {
    tableName: 'message',
    timestamps: false,
    freezeTableName: true
  });

  return Message;
};
