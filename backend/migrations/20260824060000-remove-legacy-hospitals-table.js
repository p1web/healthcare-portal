'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('hospital_profiles', 'rating', {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: false,
        defaultValue: 0
      }, { transaction });
      await queryInterface.addColumn('hospital_profiles', 'discount', {
        type: Sequelize.STRING(20),
        allowNull: true
      }, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE hospital_profiles hp
        SET rating = COALESCE(h.rating, 0),
            discount = h.discount
        FROM hospitals h
        WHERE hp.hospital_id = h.id
      `, { transaction });

      await queryInterface.removeConstraint('doctor_profiles', 'doctor_profiles_hospital_id_fkey', { transaction });
      await queryInterface.sequelize.query(`
        UPDATE doctor_profiles dp
        SET hospital_id = hp.id
        FROM hospital_profiles hp
        WHERE dp.hospital_id = hp.hospital_id
      `, { transaction });
      await queryInterface.addConstraint('doctor_profiles', {
        fields: ['hospital_id'],
        type: 'foreign key',
        name: 'doctor_profiles_hospital_id_fkey',
        references: { table: 'hospital_profiles', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        transaction
      });

      await queryInterface.removeConstraint('coupon_hospitals', 'coupon_hospitals_hospital_id_fkey', { transaction });
      await queryInterface.sequelize.query(`
        UPDATE coupon_hospitals ch
        SET hospital_id = hp.id
        FROM hospital_profiles hp
        WHERE ch.hospital_id = hp.hospital_id
      `, { transaction });
      await queryInterface.addConstraint('coupon_hospitals', {
        fields: ['hospital_id'],
        type: 'foreign key',
        name: 'coupon_hospitals_hospital_id_fkey',
        references: { table: 'hospital_profiles', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        transaction
      });

      await queryInterface.removeColumn('hospital_profiles', 'hospital_id', { transaction });
      await queryInterface.dropTable('hospital_images', { transaction });
      await queryInterface.dropTable('hospital_accreditations', { transaction });
      await queryInterface.dropTable('hospital_facilities', { transaction });
      await queryInterface.dropTable('hospital_specialties', { transaction });
      await queryInterface.dropTable('hospitals', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('hospitals', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        location: Sequelize.STRING(255),
        address: Sequelize.TEXT,
        phone: Sequelize.STRING(20),
        email: Sequelize.STRING(255),
        rating: { type: Sequelize.DECIMAL(2, 1), defaultValue: 0 },
        discount: Sequelize.STRING(20),
        description: Sequelize.TEXT,
        beds: Sequelize.INTEGER,
        established: Sequelize.INTEGER,
        operating_hours: Sequelize.STRING(100),
        emergency_available: { type: Sequelize.BOOLEAN, defaultValue: false },
        ambulance_available: { type: Sequelize.BOOLEAN, defaultValue: false },
        registration_number: Sequelize.STRING(50),
        hospital_type: Sequelize.STRING(30),
        is_published: { type: Sequelize.BOOLEAN, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      }, { transaction });

      await queryInterface.sequelize.query(`
        INSERT INTO hospitals (
          id, name, location, address, phone, email, rating, discount,
          description, beds, established, operating_hours, emergency_available,
          ambulance_available, registration_number, hospital_type, is_published,
          created_at, updated_at
        )
        SELECT hp.id, hp.hospital_name,
               CONCAT_WS(', ', hp.hospital_city, hp.hospital_state),
               hp.hospital_address, hp.hospital_phone, hp.hospital_email,
               hp.rating, hp.discount, hp.bio, hp.total_beds, hp.established_year,
               hp.operating_hours, hp.emergency_services, hp.ambulance_services,
               hp.registration_number, hp.hospital_type,
               (hp.verification_status = 'approved' AND u.is_active AND NOT u.is_blocked),
               hp.created_at, hp.updated_at
        FROM hospital_profiles hp
        JOIN users u ON u.id = hp.user_id
      `, { transaction });

      await queryInterface.addColumn('hospital_profiles', 'hospital_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'hospitals', key: 'id' },
        onDelete: 'SET NULL'
      }, { transaction });
      await queryInterface.sequelize.query('UPDATE hospital_profiles SET hospital_id = id', { transaction });

      await queryInterface.removeConstraint('doctor_profiles', 'doctor_profiles_hospital_id_fkey', { transaction });
      await queryInterface.addConstraint('doctor_profiles', {
        fields: ['hospital_id'], type: 'foreign key', name: 'doctor_profiles_hospital_id_fkey',
        references: { table: 'hospitals', field: 'id' }, onDelete: 'SET NULL', transaction
      });
      await queryInterface.removeConstraint('coupon_hospitals', 'coupon_hospitals_hospital_id_fkey', { transaction });
      await queryInterface.addConstraint('coupon_hospitals', {
        fields: ['hospital_id'], type: 'foreign key', name: 'coupon_hospitals_hospital_id_fkey',
        references: { table: 'hospitals', field: 'id' }, onDelete: 'CASCADE', transaction
      });

      await queryInterface.removeColumn('hospital_profiles', 'rating', { transaction });
      await queryInterface.removeColumn('hospital_profiles', 'discount', { transaction });
    });
  }
};