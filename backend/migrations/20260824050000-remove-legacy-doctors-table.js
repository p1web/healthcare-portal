'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('appointments', 'doctor_profile_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE appointments a
        SET doctor_profile_id = d.doctor_profile_id
        FROM doctors d
        WHERE d.id = a.doctor_id
          AND d.doctor_profile_id IS NOT NULL
      `, { transaction });

      await queryInterface.sequelize.query(`
        DELETE FROM appointments
        WHERE doctor_profile_id IS NULL
      `, { transaction });

      await queryInterface.removeColumn('appointments', 'doctor_id', { transaction });
      await queryInterface.changeColumn('appointments', 'doctor_profile_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'doctor_profiles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });
      await queryInterface.addIndex('appointments', ['doctor_profile_id'], {
        name: 'appointments_doctor_profile_id_idx',
        transaction
      });

      await queryInterface.addColumn('doctor_availability', 'doctor_profile_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE doctor_availability da
        SET doctor_profile_id = d.doctor_profile_id
        FROM doctors d
        WHERE d.id = da.doctor_id
          AND d.doctor_profile_id IS NOT NULL
      `, { transaction });

      await queryInterface.sequelize.query(`
        DELETE FROM doctor_availability
        WHERE doctor_profile_id IS NULL
      `, { transaction });

      await queryInterface.removeColumn('doctor_availability', 'doctor_id', { transaction });
      await queryInterface.changeColumn('doctor_availability', 'doctor_profile_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'doctor_profiles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });
      await queryInterface.addIndex('doctor_availability', ['doctor_profile_id'], {
        name: 'doctor_availability_doctor_profile_id_idx',
        transaction
      });
      await queryInterface.addConstraint('doctor_availability', {
        fields: ['doctor_profile_id', 'day_of_week'],
        type: 'unique',
        name: 'unique_doctor_profile_day',
        transaction
      });

      await queryInterface.dropTable('doctors', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('doctors', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        doctor_profile_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'doctor_profiles', key: 'id' },
          onDelete: 'CASCADE'
        },
        name: { type: Sequelize.STRING(255), allowNull: false },
        specialization_id: { type: Sequelize.INTEGER, allowNull: false },
        hospital_id: { type: Sequelize.INTEGER, allowNull: false },
        experience: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        rating: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
        fee: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        email: { type: Sequelize.STRING(255), allowNull: false },
        phone: { type: Sequelize.STRING(20), allowNull: false },
        qualification: { type: Sequelize.STRING(255), allowNull: true },
        bio: { type: Sequelize.TEXT, allowNull: true },
        image: { type: Sequelize.STRING(500), allowNull: true },
        consultation_duration: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
        is_published: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        published_at: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      }, { transaction });

      await queryInterface.sequelize.query(`
        INSERT INTO doctors (
          id, doctor_profile_id, name, specialization_id, hospital_id,
          experience, rating, fee, email, phone, qualification,
          consultation_duration, is_published, published_at, created_at, updated_at
        )
        SELECT dp.id, dp.id, u.name, dp.specialization_id, dp.hospital_id,
               COALESCE(dp.years_of_experience, 0), 0, COALESCE(dp.consultation_fee, 0),
               u.email, u.phone, dp.qualification, 30,
               (dp.verification_status = 'approved' AND u.is_active AND NOT u.is_blocked),
               dp.last_verified_at, dp.created_at, dp.updated_at
        FROM doctor_profiles dp
        JOIN users u ON u.id = dp.user_id
        WHERE dp.specialization_id IS NOT NULL
          AND dp.hospital_id IS NOT NULL
      `, { transaction });

      await queryInterface.addColumn('appointments', 'doctor_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });
      await queryInterface.sequelize.query(
        'UPDATE appointments SET doctor_id = doctor_profile_id',
        { transaction }
      );
      await queryInterface.removeColumn('appointments', 'doctor_profile_id', { transaction });
      await queryInterface.changeColumn('appointments', 'doctor_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'doctors', key: 'id' },
        onDelete: 'CASCADE'
      }, { transaction });

      await queryInterface.addColumn('doctor_availability', 'doctor_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });
      await queryInterface.sequelize.query(
        'UPDATE doctor_availability SET doctor_id = doctor_profile_id',
        { transaction }
      );
      await queryInterface.removeColumn('doctor_availability', 'doctor_profile_id', { transaction });
      await queryInterface.changeColumn('doctor_availability', 'doctor_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'doctors', key: 'id' },
        onDelete: 'CASCADE'
      }, { transaction });
    });
  }
};
