'use strict';

// CR revision: patient always pays the full consultation fee upfront. Coupon
// discount is deferred and issued as cashback after the doctor marks the
// appointment completed. Commission is now charged on original_price
// (platform absorbs the cashback from its own commission revenue).
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      await qi.addColumn('appointments', 'cashback_status', {
        type: Sequelize.ENUM('none', 'pending', 'issued', 'forfeited'),
        allowNull: false,
        defaultValue: 'none'
      }, { transaction });

      await qi.addColumn('appointments', 'cashback_issued_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await qi.addColumn('appointments', 'cashback_transaction_id', {
        type: Sequelize.STRING(64),
        allowNull: true
      }, { transaction });

      // Existing rows: any coupon discount was already "netted off" the fee
      // in the old flow; treat those as already-settled cashback so live
      // totals stay consistent.
      await qi.sequelize.query(
        `UPDATE appointments
         SET cashback_status = CASE
               WHEN discount_amount IS NULL OR discount_amount = 0 THEN 'none'::"enum_appointments_cashback_status"
               WHEN status IN ('completed') THEN 'issued'::"enum_appointments_cashback_status"
               WHEN status IN ('cancelled', 'rejected') THEN 'forfeited'::"enum_appointments_cashback_status"
               ELSE 'pending'::"enum_appointments_cashback_status"
             END,
             cashback_issued_at = CASE
               WHEN status = 'completed' AND discount_amount > 0 THEN updated_at
               ELSE NULL
             END`,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      await qi.removeColumn('appointments', 'cashback_transaction_id', { transaction });
      await qi.removeColumn('appointments', 'cashback_issued_at', { transaction });
      await qi.removeColumn('appointments', 'cashback_status', { transaction });
      await qi.sequelize.query(`DROP TYPE IF EXISTS "enum_appointments_cashback_status"`, { transaction });
    });
  }
};
