'use strict';

module.exports = app => {
 const { STRING, INTEGER, DATE } = app.Sequelize;
 const PointRecord = app.model.define('pointRecord', {
   id: { type: INTEGER, primaryKey: true, autoIncrement: true },
   username: { type: STRING(20), allowNull: false },
   delta: { type: INTEGER, allowNull: false },
   reason: { type: STRING(100), allowNull: true },
   pointBefore: { type: INTEGER, allowNull: false, defaultValue: 0 },
   pointAfter: { type: INTEGER, allowNull: false, defaultValue: 0 },
   createdAt: { type: DATE },
 }, {
   tableName: 'pointRecord',
   timestamps: false,
   freezeTableName: true
 });
 return PointRecord;
};
