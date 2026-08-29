'use strict';

// Rename hospital/doctor "commission" percents/amounts to "payout" — they're
// the parties' shares of the fee, not commissions the platform charges.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE doctor_practices
         DROP CONSTRAINT IF EXISTS doctor_practices_commission_sum_check`,
        { transaction }
      );

      await queryInterface.renameColumn('doctor_practices', 'hospital_commission_percent', 'hospital_payout_percent', { transaction });
      await queryInterface.renameColumn('doctor_practices', 'doctor_commission_percent', 'doctor_payout_percent', { transaction });

      await queryInterface.sequelize.query(
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

      await queryInterface.renameColumn('appointments', 'hospital_commission_amount', 'hospital_payout_amount', { transaction });
      await queryInterface.renameColumn('appointments', 'doctor_commission_amount', 'doctor_payout_amount', { transaction });

      await queryInterface.renameColumn('platform_commission_settings', 'default_split_hospital_commission_percent', 'default_split_hospital_payout_percent', { transaction });
      await queryInterface.renameColumn('platform_commission_settings', 'default_split_doctor_commission_percent', 'default_split_doctor_payout_percent', { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('platform_commission_settings', 'default_split_doctor_payout_percent', 'default_split_doctor_commission_percent', { transaction });
      await queryInterface.renameColumn('platform_commission_settings', 'default_split_hospital_payout_percent', 'default_split_hospital_commission_percent', { transaction });

      await queryInterface.renameColumn('appointments', 'doctor_payout_amount', 'doctor_commission_amount', { transaction });
      await queryInterface.renameColumn('appointments', 'hospital_payout_amount', 'hospital_commission_amount', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE doctor_practices DROP CONSTRAINT IF EXISTS doctor_practices_share_sum_check`,
        { transaction }
      );

      await queryInterface.renameColumn('doctor_practices', 'doctor_payout_percent', 'doctor_commission_percent', { transaction });
      await queryInterface.renameColumn('doctor_practices', 'hospital_payout_percent', 'hospital_commission_percent', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE doctor_practices
         ADD CONSTRAINT doctor_practices_commission_sum_check
         CHECK (
           platform_commission_percent >= 0
           AND hospital_commission_percent >= 0
           AND doctor_commission_percent >= 0
           AND (platform_commission_percent + hospital_commission_percent + doctor_commission_percent) <= 100
         )`,
        { transaction }
      );
    });
  }
};
