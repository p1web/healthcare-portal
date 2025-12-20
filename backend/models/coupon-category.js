'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CouponCategory extends Model {
    static associate(models) {
      // One-to-Many with Coupon
      CouponCategory.hasMany(models.Coupon, {
        foreignKey: 'category_id',
        as: 'coupons'
      });
    }
  }

  CouponCategory.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'CouponCategory',
    tableName: 'coupon_categories',
    underscored: true,
    timestamps: true
  });

  return CouponCategory;
};
