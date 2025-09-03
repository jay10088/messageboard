'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE } = app.Sequelize;

  const PointRecord = app.model.define('pointRecord', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: STRING(20), allowNull: false },
    delta: { type: INTEGER, allowNull: false },
    createdAt: { type: DATE },
  }, {
    tableName: 'pointRecord',
    timestamps: false,
    freezeTableName: true
  });

  return PointRecord;
};
