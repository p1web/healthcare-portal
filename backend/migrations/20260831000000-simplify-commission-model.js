'use strict';

// Retires the three-way payout split. Commission is now a single per-hospital
// rate on hospital_profiles (MOU-driven). Doctor payout = fee - commission;
// hospital is invoiced the commission by the platform.
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      // 1. hospital_profiles.hospital_commission_percent (MOU rate, default 20%).
      await qi.addColumn('hospital_profiles', 'hospital_commission_percent', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 20.00
      }, { transaction });

      // Backfill from each hospital's primary active practice, falling back to 20.
      await qi.sequelize.query(
        `UPDATE hospital_profiles hp
         SET hospital_commission_percent = COALESCE(sub.platform_commission_percent, 20)
         FROM (
           SELECT dp.hospital_profile_id, MAX(dp.platform_commission_percent) AS platform_commission_percent
           FROM doctor_practices dp
           WHERE dp.is_primary = TRUE AND dp.is_active = TRUE
           GROUP BY dp.hospital_profile_id
         ) sub
         WHERE hp.id = sub.hospital_profile_id`,
        { transaction }
      );

      // 2. Drop retired columns on doctor_practices.
      await qi.sequelize.query(
        `ALTER TABLE doctor_practices DROP CONSTRAINT IF EXISTS doctor_practices_share_sum_check`,
        { transaction }
      );
      await qi.removeColumn('doctor_practices', 'commission_mode', { transaction });
      await qi.removeColumn('doctor_practices', 'hospital_payout_percent', { transaction });
      await qi.removeColumn('doctor_practices', 'doctor_payout_percent', { transaction });
      await qi.removeColumn('doctor_practices', 'commission_overridden', { transaction });
      await qi.sequelize.query(
        `DROP TYPE IF EXISTS "enum_doctor_practices_commission_mode"`,
        { transaction }
      );

      // Practice-level platform_commission_percent becomes a snapshot only; keep column but no
      // longer treat it as the source of truth. Backfill any zero rows from the hospital.
      await qi.sequelize.query(
        `UPDATE doctor_practices dp
         SET platform_commission_percent = hp.hospital_commission_percent
         FROM hospital_profiles hp
         WHERE dp.hospital_profile_id = hp.id
           AND (dp.platform_commission_percent IS NULL OR dp.platform_commission_percent = 0)`,
        { transaction }
      );

      // 3. Drop retired columns on appointments.
      await qi.removeColumn('appointments', 'hospital_payout_amount', { transaction });
      await qi.removeColumn('appointments', 'commission_mode_snapshot', { transaction });
      await qi.sequelize.query(
        `DROP TYPE IF EXISTS "enum_appointments_commission_mode_snapshot"`,
        { transaction }
      );

      // 4. Collapse platform_commission_settings to a single default_commission_percent.
      await qi.addColumn('platform_commission_settings', 'default_commission_percent', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 20.00
      }, { transaction });

      // Reasonable backfill: reuse the old split platform percent if present, else 20.
      await qi.sequelize.query(
        `UPDATE platform_commission_settings
         SET default_commission_percent = COALESCE(default_split_platform_commission_percent, 20)`,
        { transaction }
      );

      await qi.removeColumn('platform_commission_settings', 'default_solo_commission_percent', { transaction });
      await qi.removeColumn('platform_commission_settings', 'default_split_platform_commission_percent', { transaction });
      await qi.removeColumn('platform_commission_settings', 'default_split_hospital_payout_percent', { transaction });
      await qi.removeColumn('platform_commission_settings', 'default_split_doctor_payout_percent', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      await qi.addColumn('platform_commission_settings', 'default_solo_commission_percent', {
        type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 15.00
      }, { transaction });
      await qi.addColumn('platform_commission_settings', 'default_split_platform_commission_percent', {
        type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 10.00
      }, { transaction });
      await qi.addColumn('platform_commission_settings', 'default_split_hospital_payout_percent', {
        type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 15.00
      }, { transaction });
      await qi.addColumn('platform_commission_settings', 'default_split_doctor_payout_percent', {
        type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 75.00
      }, { transaction });
      await qi.removeColumn('platform_commission_settings', 'default_commission_percent', { transaction });

      await qi.addColumn('appointments', 'commission_mode_snapshot', {
        type: Sequelize.ENUM('single', 'split'), allowNull: true
      }, { transaction });
      await qi.addColumn('appointments', 'hospital_payout_amount', {
        type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0
      }, { transaction });

      await qi.addColumn('doctor_practices', 'commission_mode', {
        type: Sequelize.ENUM('single', 'split'), allowNull: false, defaultValue: 'split'
      }, { transaction });
      await qi.addColumn('doctor_practices', 'hospital_payout_percent', {
        type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0
      }, { transaction });
      await qi.addColumn('doctor_practices', 'doctor_payout_percent', {
        type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0
      }, { transaction });
      await qi.addColumn('doctor_practices', 'commission_overridden', {
        type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false
      }, { transaction });
      await qi.sequelize.query(
        `ALTER TABLE doctor_practices
         ADD CONSTRAINT doctor_practices_share_sum_check
         CHECK (
           platform_commission_percent >= 0
           AND hospital_payout_percent >= 0
           AND doctor_payout_percent >= 0
           AND (platform_commission_percent + hospital_payout_percent + doctor_payout_percent) <= 100
         )`,
        { transaction }
      );

      await qi.removeColumn('hospital_profiles', 'hospital_commission_percent', { transaction });
    });
  }
};
