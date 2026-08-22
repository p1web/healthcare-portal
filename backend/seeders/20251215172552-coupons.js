'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('coupons', [
      {
        code: 'HEALTH20',
        title: 'First Time Consultation',
        description: 'Get 20% off on your first consultation with any doctor',
        discount_text: '20% OFF',
        discount_type: 'percentage',
        discount_value: 20,
        min_amount: 500,
        max_discount: 500,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31'),
        usage_limit: 1000,
        used_count: 342,
        category_id: 1, // Consultation
        terms: JSON.stringify([
          'Valid for first-time users only',
          'Minimum consultation fee of ₹500 required',
          'Cannot be combined with other offers',
          'Valid for online and offline consultations'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'SURGERY30',
        title: 'Surgery Discount',
        description: 'Save 30% on all surgical procedures',
        discount_text: '30% OFF',
        discount_type: 'percentage',
        discount_value: 30,
        min_amount: 10000,
        max_discount: 15000,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-06-30'),
        usage_limit: 500,
        used_count: 156,
        category_id: 2, // Surgery
        terms: JSON.stringify([
          'Valid at select hospitals only',
          'Minimum procedure cost of ₹10,000',
          'Maximum discount of ₹15,000',
          'Subject to doctor availability'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'DIAGNOSTIC15',
        title: 'Lab Test Savings',
        description: 'Get 15% discount on all diagnostic tests',
        discount_text: '15% OFF',
        discount_type: 'percentage',
        discount_value: 15,
        min_amount: 300,
        max_discount: 1000,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31'),
        usage_limit: 2000,
        used_count: 892,
        category_id: 3, // Diagnostic
        terms: JSON.stringify([
          'Valid for all blood tests and imaging',
          'Home sample collection available',
          'Results within 24-48 hours',
          'No maximum usage limit per user'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'WELLNESS500',
        title: 'Health Checkup Package',
        description: 'Flat ₹500 off on comprehensive health checkup packages',
        discount_text: '₹500 OFF',
        discount_type: 'fixed',
        discount_value: 500,
        min_amount: 2000,
        max_discount: null,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31'),
        usage_limit: 1500,
        used_count: 623,
        category_id: 3, // Diagnostic
        terms: JSON.stringify([
          'Valid on packages worth ₹2,000 and above',
          'Includes full body checkup',
          'Free home sample collection',
          'Valid at all partner hospitals'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'CARDIO25',
        title: 'Heart Health Special',
        description: '25% off on cardiology consultations and tests',
        discount_text: '25% OFF',
        discount_type: 'percentage',
        discount_value: 25,
        min_amount: 1000,
        max_discount: 2000,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-03-31'),
        usage_limit: 300,
        used_count: 87,
        category_id: 1, // Consultation
        terms: JSON.stringify([
          'Valid for cardiology department only',
          'Includes ECG and consultation',
          'Available at City General Hospital',
          'Limited time offer'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'PHARMACY10',
        title: 'Medicine Discount',
        description: 'Get 10% off on all medicines',
        discount_text: '10% OFF',
        discount_type: 'percentage',
        discount_value: 10,
        min_amount: 200,
        max_discount: 500,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31'),
        usage_limit: 5000,
        used_count: 2341,
        category_id: 4, // Pharmacy
        terms: JSON.stringify([
          'Valid on all prescription medicines',
          'Free home delivery on orders above ₹500',
          'Valid prescription required',
          'Can be used multiple times'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'CHECKUP100',
        title: 'Annual Health Checkup',
        description: 'Flat ₹100 off on annual health checkup',
        discount_text: '₹100 OFF',
        discount_type: 'fixed',
        discount_value: 100,
        min_amount: 1000,
        max_discount: null,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31'),
        usage_limit: 3000,
        used_count: 1245,
        category_id: 5, // Wellness
        terms: JSON.stringify([
          'Valid on annual health checkup packages',
          'Minimum package value ₹1,000',
          'Valid for all age groups',
          'Free doctor consultation included'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'DENTAL20',
        title: 'Dental Care Discount',
        description: '20% off on dental consultations and procedures',
        discount_text: '20% OFF',
        discount_type: 'percentage',
        discount_value: 20,
        min_amount: 800,
        max_discount: 1500,
        valid_from: new Date('2024-01-01'),
        valid_until: new Date('2025-12-31'),
        usage_limit: 800,
        used_count: 234,
        category_id: 1, // Consultation
        terms: JSON.stringify([
          'Valid for dental consultations and treatments',
          'Minimum bill of ₹800 required',
          'Valid at partner dental clinics',
          'Prior appointment required'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('coupons', null, {});
  }
};
