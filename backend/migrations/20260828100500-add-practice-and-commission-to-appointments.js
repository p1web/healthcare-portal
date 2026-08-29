'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('appointments', 'practice_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'doctor_practices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }, { transaction });

      await queryInterface.addColumn('appointments', 'hospital_profile_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'hospital_profiles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }, { transaction });

      await queryInterface.addColumn('appointments', 'platform_revenue_amount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      }, { transaction });
      await queryInterface.addColumn('appointments', 'hospital_commission_amount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      }, { transaction });
      await queryInterface.addColumn('appointments', 'doctor_commission_amount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      }, { transaction });
      await queryInterface.addColumn('appointments', 'commission_mode_snapshot', {
        type: Sequelize.ENUM('single', 'split'),
        allowNull: true
      }, { transaction });

      // Backfill practice_id + hospital_profile_id from doctor's primary practice.
      await queryInterface.sequelize.query(
        `UPDATE appointments a
         SET practice_id = dpr.id,
             hospital_profile_id = dpr.hospital_profile_id
         FROM doctor_practices dpr
         WHERE dpr.doctor_profile_id = a.doctor_profile_id
           AND dpr.is_primary = TRUE`,
        { transaction }
      );

      await queryInterface.addIndex('appointments', ['practice_id'], {
        name: 'appointments_practice_id_idx',
        transaction
      });
      await queryInterface.addIndex('appointments', ['hospital_profile_id'], {
        name: 'appointments_hospital_profile_id_idx',
        transaction
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('appointments', 'appointments_hospital_profile_id_idx', { transaction });
      await queryInterface.removeIndex('appointments', 'appointments_practice_id_idx', { transaction });
      await queryInterface.removeColumn('appointments', 'commission_mode_snapshot', { transaction });
      await queryInterface.removeColumn('appointments', 'doctor_commission_amount', { transaction });
      await queryInterface.removeColumn('appointments', 'hospital_commission_amount', { transaction });
      await queryInterface.removeColumn('appointments', 'platform_revenue_amount', { transaction });
      await queryInterface.removeColumn('appointments', 'hospital_profile_id', { transaction });
      await queryInterface.removeColumn('appointments', 'practice_id', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_appointments_commission_mode_snapshot"', { transaction });
    });
  }
};
