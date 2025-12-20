'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupon_usage', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      coupon_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'coupons',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User who used the coupon (if tracked)'
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Associated order/booking ID'
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Actual discount amount applied'
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('coupon_usage', ['coupon_id']);
    await queryInterface.addIndex('coupon_usage', ['user_id']);
    await queryInterface.addIndex('coupon_usage', ['used_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('coupon_usage');
  }
};
