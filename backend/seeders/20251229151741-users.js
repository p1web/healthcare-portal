'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await queryInterface.bulkInsert('users', [
      // Admin User
      {
        name: 'System Administrator',
        email: 'systemadmin@gmail.com',
        phone: '9999999999',
        password: hashedPassword,
        role: 'admin',
        is_email_verified: true,
        is_phone_verified: true,
        is_active: true,
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },

      // Patient Users
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.patient@example.com',
        phone: '9876543210',
        password: hashedPassword,
        role: 'patient',
        is_email_verified: true,
        is_phone_verified: true,
        gender: 'male',
        date_of_birth: new Date('1990-05-15'),
        address: '123 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        is_active: true,
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Priya Sharma',
        email: 'priya.patient@example.com',
        phone: '9876543211',
        password: hashedPassword,
        role: 'patient',
        is_email_verified: true,
        is_phone_verified: true,
        gender: 'female',
        date_of_birth: new Date('1995-08-20'),
        address: '456 Park Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        is_active: true,
        terms_accepted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },

      // Doctor / hospital users are provisioned by the newer seeder
      // 20260826040000-clean-public-doctors-hospitals.js.
    ], { ignoreDuplicates: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
