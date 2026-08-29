'use strict';
const { Model } = require('sequelize');

const COMMISSION_MODES = Object.freeze({ SINGLE: 'single', SPLIT: 'split' });
const PRACTICE_STATUSES = Object.freeze({
  PENDING_HOSPITAL_APPROVAL: 'pending_hospital_approval',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  INACTIVE: 'inactive'
});

module.exports = (sequelize, DataTypes) => {
  class DoctorPractice extends Model {
    static associate(models) {
      DoctorPractice.belongsTo(models.DoctorProfile, {
        foreignKey: 'doctor_profile_id',
        as: 'doctor'
      });
      DoctorPractice.belongsTo(models.HospitalProfile, {
        foreignKey: 'hospital_profile_id',
        as: 'hospital'
      });
      DoctorPractice.hasMany(models.DoctorAvailability, {
        foreignKey: 'practice_id',
        as: 'availabilities'
      });
      DoctorPractice.hasMany(models.Appointment, {
        foreignKey: 'practice_id',
        as: 'appointments'
      });
    }
  }

  DoctorPractice.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    doctorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_profile_id'
    },
    hospitalProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'hospital_profile_id'
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'consultation_fee'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_primary'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    status: {
      type: DataTypes.ENUM(
        PRACTICE_STATUSES.PENDING_HOSPITAL_APPROVAL,
        PRACTICE_STATUSES.ACTIVE,
        PRACTICE_STATUSES.REJECTED,
        PRACTICE_STATUSES.INACTIVE
      ),
      allowNull: false,
      defaultValue: PRACTICE_STATUSES.ACTIVE
    },
    commissionMode: {
      type: DataTypes.ENUM(COMMISSION_MODES.SINGLE, COMMISSION_MODES.SPLIT),
      allowNull: false,
      defaultValue: COMMISSION_MODES.SPLIT,
      field: 'commission_mode'
    },
    platformCommissionPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'platform_commission_percent'
    },
    hospitalPayoutPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'hospital_payout_percent'
    },
    doctorPayoutPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'doctor_payout_percent'
    },
    commissionOverridden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'commission_overridden'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'DoctorPractice',
    tableName: 'doctor_practices',
    underscored: true,
    timestamps: true
  });

  DoctorPractice.COMMISSION_MODES = COMMISSION_MODES;
  DoctorPractice.STATUSES = PRACTICE_STATUSES;

  return DoctorPractice;
};

module.exports.COMMISSION_MODES = COMMISSION_MODES;
module.exports.PRACTICE_STATUSES = PRACTICE_STATUSES;
