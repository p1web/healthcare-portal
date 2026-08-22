'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('coupon_categories', [
      {
        name: 'Consultation',
        slug: 'consultation',
        description: 'Discounts on doctor consultations and appointments',
        icon: 'bi-person-video3',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Surgery',
        slug: 'surgery',
        description: 'Discounts on surgical procedures and operations',
        icon: 'bi-hospital',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Diagnostic',
        slug: 'diagnostic',
        description: 'Discounts on lab tests, imaging, and health checkups',
        icon: 'bi-clipboard2-pulse',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Pharmacy',
        slug: 'pharmacy',
        description: 'Discounts on medicines and pharmaceutical products',
        icon: 'bi-capsule',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Wellness',
        slug: 'wellness',
        description: 'Discounts on health packages and wellness programs',
        icon: 'bi-heart-pulse',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Emergency',
        slug: 'emergency',
        description: 'Discounts on emergency services and ambulance',
        icon: 'bi-ambulance',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('coupon_categories', null, {});
  }
};
