'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupons', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      discount_text: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Display text like "20% OFF" or "₹500 OFF"'
      },
      discount_type: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false,
        defaultValue: 'percentage'
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Percentage value or fixed amount'
      },
      min_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Minimum order amount required'
      },
      max_discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Maximum discount amount (for percentage type)'
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: false
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: false
      },
      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Total number of times coupon can be used'
      },
      used_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Number of times coupon has been used'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'coupon_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      terms: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of terms and conditions'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    await queryInterface.addIndex('coupons', ['code']);
    await queryInterface.addIndex('coupons', ['category_id']);
    await queryInterface.addIndex('coupons', ['is_active']);
    await queryInterface.addIndex('coupons', ['valid_from', 'valid_until']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('coupons');
  }
};