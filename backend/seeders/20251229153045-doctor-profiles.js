'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('doctor_profiles', [
      (() => {
        const reviewedAt = new Date();
        const uploadedAt = reviewedAt.toISOString();
        return {
          user_id: 4, // Dr. Amit Patel
          registration_number: 'MH-MED-12345',
          qualification: 'MBBS, MS (Orthopedics)',
          specialization_id: 3, // Orthopedics
          years_of_experience: 12,
          consultation_fee: 1200.00,
          is_verified: true,
          verification_status: 'approved',
          submitted_at: reviewedAt,
          reviewed_at: reviewedAt,
          last_verified_at: reviewedAt,
          verification_documents: JSON.stringify([
            { name: 'degree.pdf', url: 'https://example.com/docs/degree.pdf', uploadedAt },
            { name: 'registration.pdf', url: 'https://example.com/docs/registration.pdf', uploadedAt }
          ]),
          created_at: reviewedAt,
          updated_at: reviewedAt
        };
      })(),
      (() => {
        const reviewedAt = new Date();
        const uploadedAt = reviewedAt.toISOString();
        return {
          user_id: 5, // Dr. Sneha Desai
          registration_number: 'MH-MED-67890',
          qualification: 'MBBS, MD (Dermatology)',
          specialization_id: 6, // Dermatology
          years_of_experience: 8,
          consultation_fee: 900.00,
          is_verified: true,
          verification_status: 'approved',
          submitted_at: reviewedAt,
          reviewed_at: reviewedAt,
          last_verified_at: reviewedAt,
          verification_documents: JSON.stringify([
            { name: 'degree2.pdf', url: 'https://example.com/docs/degree2.pdf', uploadedAt },
            { name: 'registration2.pdf', url: 'https://example.com/docs/registration2.pdf', uploadedAt }
          ]),
          created_at: reviewedAt,
          updated_at: reviewedAt
        };
      })()
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('doctor_profiles', null, {});
  }
};