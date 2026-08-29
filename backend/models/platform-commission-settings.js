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
    defaultSoloCommissionPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 15.00,
      field: 'default_solo_commission_percent'
    },
    defaultSplitPlatformCommissionPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 10.00,
      field: 'default_split_platform_commission_percent'
    },
    defaultSplitHospitalPayoutPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 15.00,
      field: 'default_split_hospital_payout_percent'
    },
    defaultSplitDoctorPayoutPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 75.00,
      field: 'default_split_doctor_payout_percent'
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
