'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('messages', 'username', {
      type: Sequelize.STRING(20),
    });
  },

  async down(queryInterface) {
  }
};
