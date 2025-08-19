'use strict';

module.exports = app => {
  const { INTEGER, TEXT} = app.Sequelize;

  const Message = app.model.define('Message', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    content: { type: TEXT, allowNull: false },
  }, {
    tableName: 'messages',
    timestamps: false,
    freezeTableName: true
  });

  return Message;
};
