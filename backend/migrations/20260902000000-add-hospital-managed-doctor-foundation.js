'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      await qi.createTable('departments', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        hospital_profile_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'hospital_profiles', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        name: { type: Sequelize.STRING(255), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });
      await qi.addIndex('departments', ['hospital_profile_id'], { transaction });
      await qi.sequelize.query(
        'CREATE UNIQUE INDEX departments_hospital_name_unique ON departments (hospital_profile_id, LOWER(name))',
        { transaction }
      );

      await qi.addColumn('hospital_profiles', 'consultation_fee_mode', {
        type: Sequelize.ENUM('STANDARD', 'PER_DOCTOR'),
        allowNull: false,
        defaultValue: 'STANDARD'
      }, { transaction });

      await qi.addColumn('hospital_staff', 'department_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }, { transaction });
      await qi.addColumn('hospital_staff', 'consultation_fee', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      }, { transaction });
      await qi.addColumn('hospital_staff', 'is_bookable', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });
      await qi.addIndex('hospital_staff', ['department_id', 'is_active', 'is_bookable'], {
        name: 'hospital_staff_booking_options_idx',
        transaction
      });

      await qi.createTable('hospital_staff_availability', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        hospital_staff_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'hospital_staff', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        day_of_week: { type: Sequelize.INTEGER, allowNull: false },
        start_time: { type: Sequelize.TIME, allowNull: false },
        end_time: { type: Sequelize.TIME, allowNull: false },
        is_available: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });
      await qi.addIndex('hospital_staff_availability', ['hospital_staff_id', 'day_of_week'], {
        name: 'hospital_staff_availability_doctor_day_idx',
        transaction
      });
      await qi.sequelize.query(
        `ALTER TABLE hospital_staff_availability
         ADD CONSTRAINT hospital_staff_availability_day_check CHECK (day_of_week BETWEEN 0 AND 6),
         ADD CONSTRAINT hospital_staff_availability_time_check CHECK (start_time < end_time)`,
        { transaction }
      );

      await qi.addColumn('appointments', 'hospital_staff_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'hospital_staff', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }, { transaction });
      await qi.addColumn('appointments', 'department_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }, { transaction });
      await qi.addIndex('appointments', ['hospital_staff_id', 'appointment_date', 'appointment_time'], {
        name: 'appointments_managed_doctor_slot_idx',
        transaction
      });
      await qi.sequelize.query(
        `ALTER TABLE appointments
         ADD CONSTRAINT appointments_managed_doctor_target_check CHECK (
           hospital_staff_id IS NULL OR (
             hospital_profile_id IS NOT NULL AND
             doctor_profile_id IS NULL AND
             practice_id IS NULL AND
             department_id IS NOT NULL
           )
         )`,
        { transaction }
      );

      await qi.sequelize.query(
        `INSERT INTO departments (hospital_profile_id, name, description, is_active, created_at, updated_at)
         SELECT id, 'General', 'Default department created during managed-doctor migration', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         FROM hospital_profiles
         ON CONFLICT DO NOTHING`,
        { transaction }
      );
      await qi.sequelize.query(
        `UPDATE hospital_staff AS staff
         SET department_id = departments.id
         FROM departments
         WHERE departments.hospital_profile_id = staff.hospital_profile_id
           AND LOWER(departments.name) = 'general'
           AND staff.department_id IS NULL`,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      await qi.sequelize.query(
        'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_managed_doctor_target_check',
        { transaction }
      );
      await qi.removeColumn('appointments', 'department_id', { transaction });
      await qi.removeColumn('appointments', 'hospital_staff_id', { transaction });
      await qi.dropTable('hospital_staff_availability', { transaction });
      await qi.removeColumn('hospital_staff', 'is_bookable', { transaction });
      await qi.removeColumn('hospital_staff', 'consultation_fee', { transaction });
      await qi.removeColumn('hospital_staff', 'department_id', { transaction });
      await qi.removeColumn('hospital_profiles', 'consultation_fee_mode', { transaction });
      await qi.dropTable('departments', { transaction });
      await qi.sequelize.query('DROP TYPE IF EXISTS "enum_hospital_profiles_consultation_fee_mode"', { transaction });
    });
  }
};
