'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const profileFields = [
      ['hospital_name', Sequelize.STRING(255)],
      ['hospital_email', Sequelize.STRING(255)],
      ['hospital_phone', Sequelize.STRING(20)],
      ['emergency_contact_number', Sequelize.STRING(20)],
      ['hospital_address', Sequelize.TEXT],
      ['hospital_city', Sequelize.STRING(100)],
      ['hospital_state', Sequelize.STRING(100)],
      ['hospital_pincode', Sequelize.STRING(10)],
      ['website', Sequelize.STRING(500)]
    ];

    for (const [name, type] of profileFields) {
      await queryInterface.addColumn('hospital_profiles', name, {
        type,
        allowNull: true
      });
    }

    await queryInterface.addColumn('hospitals', 'emergency_contact_number', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    await queryInterface.addColumn('hospitals', 'website', {
      type: Sequelize.STRING(500),
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE hospital_profiles hp
      SET hospital_name = h.name,
          hospital_email = h.email,
          hospital_phone = h.phone,
          emergency_contact_number = h.phone,
          hospital_address = h.address,
          hospital_city = NULLIF(TRIM(SPLIT_PART(h.location, ',', 1)), ''),
          hospital_state = NULLIF(TRIM(SPLIT_PART(h.location, ',', 2)), '')
      FROM hospitals h
      WHERE h.id = hp.hospital_id
    `);

    await queryInterface.sequelize.query(`
      UPDATE hospital_profiles hp
      SET hospital_name = COALESCE(hospital_name, u.name),
          hospital_email = COALESCE(hospital_email, u.email),
          hospital_phone = COALESCE(hospital_phone, u.phone),
          emergency_contact_number = COALESCE(emergency_contact_number, u.phone),
          hospital_address = COALESCE(hospital_address, u.address),
          hospital_city = COALESCE(hospital_city, u.city),
          hospital_state = COALESCE(hospital_state, u.state),
          hospital_pincode = COALESCE(hospital_pincode, u.pincode)
      FROM users u
      WHERE u.id = hp.user_id
    `);

    await queryInterface.sequelize.query(`
      UPDATE hospitals h
      SET emergency_contact_number = hp.emergency_contact_number
      FROM hospital_profiles hp
      WHERE hp.hospital_id = h.id
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('hospitals', 'website');
    await queryInterface.removeColumn('hospitals', 'emergency_contact_number');

    const profileFields = [
      'website',
      'hospital_pincode',
      'hospital_state',
      'hospital_city',
      'hospital_address',
      'emergency_contact_number',
      'hospital_phone',
      'hospital_email',
      'hospital_name'
    ];

    for (const name of profileFields) {
      await queryInterface.removeColumn('hospital_profiles', name);
    }
  }
};
