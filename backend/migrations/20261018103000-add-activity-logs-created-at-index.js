'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('activity_logs', ['created_at'], {
      name: 'activity_logs_created_at_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('activity_logs', 'activity_logs_created_at_idx');
  }
};