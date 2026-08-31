'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PlatformCommissionSettings extends Model {
    static associate(models) {
      PlatformCommissionSettings.belongsTo(models.User, {
        foreignKey: 'updated_by_user_id',
        as: 'updatedBy'
      });
    }
  }

  PlatformCommissionSettings.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    defaultCommissionPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 20.00,
      field: 'default_commission_percent'
    },
    updatedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'updated_by_user_id'
    }
  }, {
    sequelize,
    modelName: 'PlatformCommissionSettings',
    tableName: 'platform_commission_settings',
    underscored: true,
    timestamps: true
  });

  return PlatformCommissionSettings;
};
