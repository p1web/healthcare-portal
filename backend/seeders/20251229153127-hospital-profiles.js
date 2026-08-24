'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('hospital_profiles', [
      (() => {
        const reviewedAt = new Date();
        const uploadedAt = reviewedAt.toISOString();
        return {
          user_id: 6, // City General Hospital
          hospital_name: 'Harborview Multispeciality Hospital',
          hospital_email: 'care@harborview.example',
          hospital_phone: '02241001000',
          hospital_address: '45 Sea Link Road, Bandra West',
          hospital_city: 'Mumbai',
          hospital_state: 'Maharashtra',
          hospital_pincode: '400050',
          registration_number: 'HOSP-MH-001',
          specialty_ids: JSON.stringify([1, 5, 8]),
          established_year: 1985,
          total_beds: 250,
          hospital_type: 'private',
          operating_hours: '24/7',
          emergency_services: true,
          ambulance_services: true,
          rating: 0,
          discount: null,
          verification_status: 'approved',
          submitted_at: reviewedAt,
          reviewed_at: reviewedAt,
          last_verified_at: reviewedAt,
          verification_documents: JSON.stringify([
            { name: 'hosp-license.pdf', url: 'https://example.com/docs/hosp-license.pdf', uploadedAt },
            { name: 'hosp-registration.pdf', url: 'https://example.com/docs/hosp-registration.pdf', uploadedAt }
          ]),
          created_at: reviewedAt,
          updated_at: reviewedAt
        };
      })(),
      (() => {
        const reviewedAt = new Date();
        const uploadedAt = reviewedAt.toISOString();
        return {
          user_id: 7, // MediCare Plus
          hospital_name: 'Westbridge Children and Orthopaedic Centre',
          hospital_email: 'contact@westbridge.example',
          hospital_phone: '02242002000',
          hospital_address: '18 Westbridge Avenue',
          hospital_city: 'Mumbai',
          hospital_state: 'Maharashtra',
          hospital_pincode: '400053',
          registration_number: 'HOSP-MH-002',
          specialty_ids: JSON.stringify([3, 4, 14]),
          established_year: 1998,
          total_beds: 180,
          hospital_type: 'private',
          operating_hours: '24/7',
          emergency_services: true,
          ambulance_services: true,
          rating: 0,
          discount: null,
          verification_status: 'approved',
          submitted_at: reviewedAt,
          reviewed_at: reviewedAt,
          last_verified_at: reviewedAt,
          verification_documents: JSON.stringify([
            { name: 'hosp2-license.pdf', url: 'https://example.com/docs/hosp2-license.pdf', uploadedAt },
            { name: 'hosp2-registration.pdf', url: 'https://example.com/docs/hosp2-registration.pdf', uploadedAt }
          ]),
          created_at: reviewedAt,
          updated_at: reviewedAt
        };
      })()
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('hospital_profiles', null, {});
  }
};