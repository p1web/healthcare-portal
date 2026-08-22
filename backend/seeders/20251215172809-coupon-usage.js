'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Sample coupon usage data
    const usageData = [];
    const now = new Date();

    // Generate sample usage for HEALTH20 (342 uses)
    for (let i = 0; i < 50; i++) {
      usageData.push({
        coupon_id: 1,
        user_id: i + 1,
        order_id: i + 1,
        discount_amount: Math.floor(Math.random() * 400) + 100, // Random between 100-500
        used_at: new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random within last 90 days
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Generate sample usage for PHARMACY10 (2341 uses - sample of 100)
    for (let i = 0; i < 100; i++) {
      usageData.push({
        coupon_id: 6,
        user_id: i + 51,
        order_id: i + 51,
        discount_amount: Math.floor(Math.random() * 450) + 50, // Random between 50-500
        used_at: new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Random within last 180 days
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    await queryInterface.bulkInsert('coupon_usage', usageData, { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('coupon_usage', null, {});
  }
};
