'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('doctor_profiles', [
      {
        user_id: 4, // Dr. Amit Patel
        doctor_id: 3, // Link to doctors table (if exists)
        registration_number: 'MH-MED-12345',
        qualification: 'MBBS, MS (Orthopedics)',
        specialization_id: 3, // Orthopedics
        years_of_experience: 12,
        consultation_fee: 1200.00,
        is_verified: true,
        verification_documents: JSON.stringify([
          'https://example.com/docs/degree.pdf',
          'https://example.com/docs/registration.pdf'
        ]),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 5, // Dr. Sneha Desai
        doctor_id: 4, // Link to doctors table (if exists)
        registration_number: 'MH-MED-67890',
        qualification: 'MBBS, MD (Dermatology)',
        specialization_id: 6, // Dermatology
        years_of_experience: 8,
        consultation_fee: 900.00,
        is_verified: true,
        verification_documents: JSON.stringify([
          'https://example.com/docs/degree2.pdf',
          'https://example.com/docs/registration2.pdf'
        ]),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('doctor_profiles', null, {});
  }
};