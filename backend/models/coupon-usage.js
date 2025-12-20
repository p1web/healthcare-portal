'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CouponUsage extends Model {
    static associate(models) {
      // Belongs to Coupon
      CouponUsage.belongsTo(models.Coupon, {
        foreignKey: 'coupon_id',
        as: 'coupon'
      });
    }
  }

  CouponUsage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    couponId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'coupon_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'order_id'
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'discount_amount'
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'used_at'
    }
  }, {
    sequelize,
    modelName: 'CouponUsage',
    tableName: 'coupon_usage',
    underscored: true,
    timestamps: true
  });

  return CouponUsage;
};