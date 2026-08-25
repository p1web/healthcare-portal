'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Pricing + coupon fields on appointments
      await queryInterface.addColumn('appointments', 'original_price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('appointments', 'discount_amount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      }, { transaction });

      await queryInterface.addColumn('appointments', 'final_price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('appointments', 'coupon_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'coupons', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await queryInterface.addIndex('appointments', ['coupon_id'], { transaction });

      // Link coupon_usage to appointment
      await queryInterface.addColumn('coupon_usage', 'appointment_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'appointments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await queryInterface.addIndex('coupon_usage', ['appointment_id'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('coupon_usage', ['appointment_id'], { transaction });
      await queryInterface.removeColumn('coupon_usage', 'appointment_id', { transaction });

      await queryInterface.removeIndex('appointments', ['coupon_id'], { transaction });
      await queryInterface.removeColumn('appointments', 'coupon_id', { transaction });
      await queryInterface.removeColumn('appointments', 'final_price', { transaction });
      await queryInterface.removeColumn('appointments', 'discount_amount', { transaction });
      await queryInterface.removeColumn('appointments', 'original_price', { transaction });
    });
  }
};
