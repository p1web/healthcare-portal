'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_appointments_status\" ADD VALUE IF NOT EXISTS 'rejected'"
    );

    await queryInterface.addColumn('appointments', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('appointments', 'rejection_reason');
    // Postgres has no DROP VALUE for enums; leave the enum value in place.
  }
};
