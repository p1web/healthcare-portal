'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const specializations = [
      'All Specializations',
      'Cardiologist',
      'Pediatrician',
      'Orthopedic',
      'Dermatologist',
      'Neurologist',
      'General Physician',
      'Psychiatrist',
      'Gynecologist',
      'ENT Specialist',
      'Ophthalmologist'
    ];

    const records = specializations.map(name => ({
      name,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert('specializations', records, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('specializations', null, {});
  }
};
