'use strict';
const bcrypt = require('bcrypt');

async function ensureLocationIds(queryInterface, stateName, districtName) {
  const [states] = await queryInterface.sequelize.query(
    'SELECT id FROM states WHERE LOWER(name) = LOWER(:name) LIMIT 1',
    { replacements: { name: stateName } }
  );
  let stateId = states[0]?.id;

  if (!stateId) {
    await queryInterface.bulkInsert('states', [{
      name: stateName,
      created_at: new Date(),
      updated_at: new Date()
    }]);
    const [insertedStates] = await queryInterface.sequelize.query(
      'SELECT id FROM states WHERE LOWER(name) = LOWER(:name) LIMIT 1',
      { replacements: { name: stateName } }
    );
    stateId = insertedStates[0].id;
  }

  const [districts] = await queryInterface.sequelize.query(
    'SELECT id FROM districts WHERE state_id = :stateId AND LOWER(name) = LOWER(:name) LIMIT 1',
    { replacements: { stateId, name: districtName } }
  );
  let districtId = districts[0]?.id;

  if (!districtId) {
    await queryInterface.bulkInsert('districts', [{
      state_id: stateId,
      name: districtName,
      created_at: new Date(),
      updated_at: new Date()
    }]);
    const [insertedDistricts] = await queryInterface.sequelize.query(
      'SELECT id FROM districts WHERE state_id = :stateId AND LOWER(name) = LOWER(:name) LIMIT 1',
      { replacements: { stateId, name: districtName } }
    );
    districtId = insertedDistricts[0].id;
  }

  return { state_id: stateId, district_id: districtId };
}

module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const mumbaiLocation = await ensureLocationIds(queryInterface, 'Maharashtra', 'Mumbai');
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
        ...mumbaiLocation,
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
        ...mumbaiLocation,
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
