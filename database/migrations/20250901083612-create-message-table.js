'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('message', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      username: {
        type: Sequelize.TEXT,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('message');
  }
};