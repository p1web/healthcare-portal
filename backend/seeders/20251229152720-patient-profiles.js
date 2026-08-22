'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('patient_profiles', [
      {
        user_id: 2, // Rajesh Kumar
        blood_group: 'O+',
        height: 175.5,
        weight: 75.0,
        allergies: JSON.stringify(['Penicillin', 'Dust']),
        medical_conditions: JSON.stringify(['Hypertension']),
        emergency_contact_name: 'Sunita Kumar',
        emergency_contact_phone: '9876543220',
        emergency_contact_relation: 'Wife',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 3, // Priya Sharma
        blood_group: 'A+',
        height: 162.0,
        weight: 58.5,
        allergies: JSON.stringify(['Peanuts']),
        medical_conditions: JSON.stringify([]),
        emergency_contact_name: 'Rahul Sharma',
        emergency_contact_phone: '9876543221',
        emergency_contact_relation: 'Brother',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('patient_profiles', null, {});
  }
};