'use strict';

// CR1: add payment mode/status + booking number to appointments.
// Every appointment gets a booking number; online appointments must be paid
// before their slot is protected. Offline appointments persist immediately
// with payment_status='pending' (pay at hospital desk).
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      await qi.addColumn('appointments', 'payment_mode', {
        type: Sequelize.ENUM('online', 'offline'),
        allowNull: false,
        defaultValue: 'offline'
      }, { transaction });

      await qi.addColumn('appointments', 'payment_status', {
        type: Sequelize.ENUM('paid', 'pending', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      }, { transaction });

      await qi.addColumn('appointments', 'booking_number', {
        type: Sequelize.STRING(32),
        allowNull: true
      }, { transaction });

      await qi.addColumn('appointments', 'paid_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await qi.addColumn('appointments', 'payment_transaction_id', {
        type: Sequelize.STRING(64),
        allowNull: true
      }, { transaction });

      // Backfill legacy rows: assume they were completed/settled = 'paid';
      // give each a booking_number of BK-{yyyymmdd of createdAt}-{id}.
      await qi.sequelize.query(
        `UPDATE appointments
         SET booking_number = 'BK-' || to_char(created_at, 'YYYYMMDD') || '-' || lpad(id::text, 6, '0'),
             payment_status = CASE
               WHEN status IN ('completed', 'confirmed') THEN 'paid'::"enum_appointments_payment_status"
               ELSE 'pending'::"enum_appointments_payment_status"
             END,
             paid_at = CASE
               WHEN status IN ('completed', 'confirmed') THEN created_at
               ELSE NULL
             END
         WHERE booking_number IS NULL`,
        { transaction }
      );

      // Enforce NOT NULL + uniqueness now that every row has a value.
      await qi.changeColumn('appointments', 'booking_number', {
        type: Sequelize.STRING(32),
        allowNull: false
      }, { transaction });

      await qi.addIndex('appointments', ['booking_number'], {
        unique: true,
        name: 'appointments_booking_number_unique',
        transaction
      });
    });
  },

  async down(queryInterface) {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (transaction) => {
      await qi.removeIndex('appointments', 'appointments_booking_number_unique', { transaction });
      await qi.removeColumn('appointments', 'payment_transaction_id', { transaction });
      await qi.removeColumn('appointments', 'paid_at', { transaction });
      await qi.removeColumn('appointments', 'booking_number', { transaction });
      await qi.removeColumn('appointments', 'payment_status', { transaction });
      await qi.removeColumn('appointments', 'payment_mode', { transaction });
      await qi.sequelize.query(`DROP TYPE IF EXISTS "enum_appointments_payment_status"`, { transaction });
      await qi.sequelize.query(`DROP TYPE IF EXISTS "enum_appointments_payment_mode"`, { transaction });
    });
  }
};
