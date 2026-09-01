'use strict';

// Optimistic concurrency for the hospital availability + accepts-bookings
// screen: every write increments hospital_profiles.availability_version, and
// the client must echo the version it loaded so stale saves are rejected
// with 409 instead of silently overwriting a concurrent edit.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('hospital_profiles', 'availability_version', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('hospital_profiles', 'availability_version');
  }
};
