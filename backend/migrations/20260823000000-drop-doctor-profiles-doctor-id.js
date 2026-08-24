'use strict';

// doctor_profiles.doctor_id was never used by the Sequelize model — the real,
// used FK is the opposite direction: doctors.doctor_profile_id.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex('doctor_profiles', ['doctor_id']);
    await queryInterface.removeColumn('doctor_profiles', 'doctor_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('doctor_profiles', 'doctor_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Link to doctors table for consultation details'
    });
    await queryInterface.addIndex('doctor_profiles', ['doctor_id']);
  }
};
