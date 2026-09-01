'use strict';

// Explicit accepts_bookings toggle so a hospital admin can close the hospital
// without leaving weekly hours as the only signal. Default true (back-compat).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('hospital_profiles', 'accepts_bookings', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('hospital_profiles', 'accepts_bookings');
  }
};
