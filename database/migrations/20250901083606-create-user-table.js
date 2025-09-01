'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      point: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'staff', 'user'),
        allowNull: false,
        defaultValue: 'user'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user');
  }
};