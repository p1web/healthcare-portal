'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('hospital_profiles', [
      {
        user_id: 6, // City General Hospital
        hospital_id: 1, // Link to hospitals table
        registration_number: 'HOSP-MH-001',
        established_year: 1985,
        total_beds: 250,
        hospital_type: 'private',
        operating_hours: '24/7',
        emergency_services: true,
        ambulance_services: true,
        is_verified: true,
        verification_documents: JSON.stringify([
          'https://example.com/docs/hosp-license.pdf',
          'https://example.com/docs/hosp-registration.pdf'
        ]),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 7, // MediCare Plus
        hospital_id: 2, // Link to hospitals table
        registration_number: 'HOSP-MH-002',
        established_year: 1998,
        total_beds: 180,
        hospital_type: 'private',
        operating_hours: '24/7',
        emergency_services: true,
        ambulance_services: true,
        is_verified: true,
        verification_documents: JSON.stringify([
          'https://example.com/docs/hosp2-license.pdf',
          'https://example.com/docs/hosp2-registration.pdf'
        ]),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('hospital_profiles', null, {});
  }
};