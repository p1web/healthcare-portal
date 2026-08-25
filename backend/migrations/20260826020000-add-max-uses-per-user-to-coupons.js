'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('coupons', 'max_uses_per_user', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Maximum times a single user can redeem this coupon (null = unlimited)'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('coupons', 'max_uses_per_user');
  }
};
