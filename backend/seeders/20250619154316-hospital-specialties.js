'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('hospital_specialties', [
      // City General Hospital (hospital_id: 1)
      { hospital_id: 1, specialty_id: 1, is_primary: true, created_at: new Date() },  // Cardiology
      { hospital_id: 1, specialty_id: 2, is_primary: false, created_at: new Date() }, // Neurology
      { hospital_id: 1, specialty_id: 3, is_primary: false, created_at: new Date() }, // Orthopedics

      // MediCare Plus (hospital_id: 2)
      { hospital_id: 2, specialty_id: 3, is_primary: true, created_at: new Date() },  // Orthopedics
      { hospital_id: 2, specialty_id: 4, is_primary: false, created_at: new Date() }, // Pediatrics
      { hospital_id: 2, specialty_id: 5, is_primary: false, created_at: new Date() }, // General Medicine

      // HealthFirst Clinic (hospital_id: 3)
      { hospital_id: 3, specialty_id: 5, is_primary: true, created_at: new Date() },  // General Medicine
      { hospital_id: 3, specialty_id: 6, is_primary: false, created_at: new Date() }, // Dermatology
      { hospital_id: 3, specialty_id: 7, is_primary: false, created_at: new Date() }, // ENT

      // Apollo Heart Center (hospital_id: 4)
      { hospital_id: 4, specialty_id: 1, is_primary: true, created_at: new Date() },  // Cardiology
      { hospital_id: 4, specialty_id: 8, is_primary: false, created_at: new Date() }, // Cardiac Surgery
      { hospital_id: 4, specialty_id: 9, is_primary: false, created_at: new Date() }, // Interventional Cardiology

      // Neuro Care Hospital (hospital_id: 5)
      { hospital_id: 5, specialty_id: 2, is_primary: true, created_at: new Date() },  // Neurology
      { hospital_id: 5, specialty_id: 10, is_primary: false, created_at: new Date() },// Neurosurgery
      { hospital_id: 5, specialty_id: 11, is_primary: false, created_at: new Date() },// Psychiatry

      // Women & Child Hospital (hospital_id: 6)
      { hospital_id: 6, specialty_id: 12, is_primary: true, created_at: new Date() }, // Gynecology
      { hospital_id: 6, specialty_id: 4, is_primary: false, created_at: new Date() },  // Pediatrics
      { hospital_id: 6, specialty_id: 13, is_primary: false, created_at: new Date() }, // Obstetrics
      { hospital_id: 6, specialty_id: 14, is_primary: false, created_at: new Date() }  // Neonatology
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('hospital_specialties', null, {});
  }
};
