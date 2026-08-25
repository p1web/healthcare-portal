'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('coupons', 'is_deleted', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });

      await queryInterface.addColumn('coupon_categories', 'is_deleted', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });

      await queryInterface.addIndex('coupons', ['is_deleted'], { transaction });
      await queryInterface.addIndex('coupon_categories', ['is_deleted'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('coupons', ['is_deleted'], { transaction });
      await queryInterface.removeIndex('coupon_categories', ['is_deleted'], { transaction });
      await queryInterface.removeColumn('coupons', 'is_deleted', { transaction });
      await queryInterface.removeColumn('coupon_categories', 'is_deleted', { transaction });
    });
  }
};
