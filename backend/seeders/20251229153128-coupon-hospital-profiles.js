'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('coupon_hospitals', [
      { coupon_id: 2, hospital_id: 1, created_at: new Date(), updated_at: new Date() },
      { coupon_id: 2, hospital_id: 2, created_at: new Date(), updated_at: new Date() },
      { coupon_id: 5, hospital_id: 1, created_at: new Date(), updated_at: new Date() }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('coupon_hospitals', null, {});
  }
};