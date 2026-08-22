'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get hospital IDs (assuming you have these hospitals in your database)
    // SURGERY30 - Valid at City General Hospital and MediCare Plus
    // CARDIO25 - Valid at City General Hospital only

    await queryInterface.bulkInsert('coupon_hospitals', [
      // SURGERY30 (coupon_id: 2) - City General Hospital (hospital_id: 1)
      {
        coupon_id: 2,
        hospital_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      // SURGERY30 (coupon_id: 2) - MediCare Plus (hospital_id: 2)
      {
        coupon_id: 2,
        hospital_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      // CARDIO25 (coupon_id: 5) - City General Hospital (hospital_id: 1)
      {
        coupon_id: 5,
        hospital_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('coupon_hospitals', null, {});
  }
};
