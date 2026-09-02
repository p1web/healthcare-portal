'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    static associate(models) {
      Department.belongsTo(models.HospitalProfile, {
        foreignKey: 'hospital_profile_id',
        as: 'hospital'
      });
      Department.hasMany(models.HospitalStaff, {
        foreignKey: 'department_id',
        as: 'doctors'
      });
      Department.hasMany(models.Appointment, {
        foreignKey: 'department_id',
        as: 'appointments'
      });
    }
  }

  Department.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    hospitalProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'hospital_profile_id'
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    underscored: true,
    timestamps: true
  });

  return Department;
};
