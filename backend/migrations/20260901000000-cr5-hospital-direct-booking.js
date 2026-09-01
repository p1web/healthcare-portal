'use strict';

// CR-5: hospital-direct booking + hospital-managed sitting-doctor records.
// - Patients can book with a hospital (not a specific doctor); appointments.doctor_profile_id
//   becomes NULLABLE and a CHECK enforces at least one of doctor/hospital targets.
// - hospital_profiles gains a default_consultation_fee (used for hospital bookings).
// - New hospital_staff table holds sitting-doctor records (name/spec/qual/exp/contact),
//   NOT tied to a user account. Displayed on public hospital detail.
// - New hospital_availability table mirrors doctor_availability (weekly schedule).
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      await qi.createTable('hospital_staff', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        hospital_profile_id: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'hospital_profiles', key: 'id' },
          onUpdate: 'CASCADE', onDelete: 'CASCADE'
        },
        name: { type: Sequelize.STRING(255), allowNull: false },
        specialization: { type: Sequelize.STRING(255), allowNull: true },
        qualification: { type: Sequelize.STRING(255), allowNull: true },
        experience_years: { type: Sequelize.INTEGER, allowNull: true },
        phone: { type: Sequelize.STRING(20), allowNull: true },
        email: { type: Sequelize.STRING(255), allowNull: true },
        bio: { type: Sequelize.TEXT, allowNull: true },
        avatar_url: { type: Sequelize.STRING(500), allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });
      await qi.addIndex('hospital_staff', ['hospital_profile_id'], { transaction });
      await qi.addIndex('hospital_staff', ['is_active'], { transaction });

      await qi.createTable('hospital_availability', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        hospital_profile_id: {
          type: Sequelize.INTEGER, allowNull: false,
          references: { model: 'hospital_profiles', key: 'id' },
          onUpdate: 'CASCADE', onDelete: 'CASCADE'
        },
        day_of_week: { type: Sequelize.INTEGER, allowNull: false },
        start_time: { type: Sequelize.TIME, allowNull: false },
        end_time: { type: Sequelize.TIME, allowNull: false },
        is_available: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });
      await qi.addIndex('hospital_availability', ['hospital_profile_id', 'day_of_week'], {
        unique: true, name: 'hospital_availability_unique_day', transaction
      });

      await qi.addColumn('hospital_profiles', 'default_consultation_fee', {
        type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 500.00
      }, { transaction });

      await qi.changeColumn('appointments', 'doctor_profile_id', {
        type: Sequelize.INTEGER, allowNull: true
      }, { transaction });

      await qi.sequelize.query(
        `ALTER TABLE appointments
         ADD CONSTRAINT appointments_target_check
         CHECK (doctor_profile_id IS NOT NULL OR hospital_profile_id IS NOT NULL)`,
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      await qi.sequelize.query(
        `ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_target_check`,
        { transaction }
      );
      await qi.changeColumn('appointments', 'doctor_profile_id', {
        type: Sequelize.INTEGER, allowNull: false
      }, { transaction });
      await qi.removeColumn('hospital_profiles', 'default_consultation_fee', { transaction });
      await qi.dropTable('hospital_availability', { transaction });
      await qi.dropTable('hospital_staff', { transaction });
    });
  }
};
