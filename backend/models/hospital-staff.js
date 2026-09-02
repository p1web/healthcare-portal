'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HospitalStaff extends Model {
    static associate(models) {
      HospitalStaff.belongsTo(models.HospitalProfile, {
        foreignKey: 'hospital_profile_id',
        as: 'hospital'
      });
      HospitalStaff.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department'
      });
      HospitalStaff.hasMany(models.HospitalStaffAvailability, {
        foreignKey: 'hospital_staff_id',
        as: 'availability'
      });
      HospitalStaff.hasMany(models.Appointment, {
        foreignKey: 'hospital_staff_id',
        as: 'appointments'
      });
    }
  }

  HospitalStaff.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    hospitalProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'hospital_profile_id'
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id'
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    specialization: { type: DataTypes.STRING(255), allowNull: true },
    qualification: { type: DataTypes.STRING(255), allowNull: true },
    experienceYears: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'experience_years'
    },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'avatar_url'
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0.01 },
      field: 'consultation_fee'
    },
    isBookable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_bookable'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'display_order'
    }
  }, {
    sequelize,
    modelName: 'HospitalStaff',
    tableName: 'hospital_staff',
    underscored: true,
    timestamps: true
  });

  return HospitalStaff;
};
