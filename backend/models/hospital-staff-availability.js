'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HospitalStaffAvailability extends Model {
    static associate(models) {
      HospitalStaffAvailability.belongsTo(models.HospitalStaff, {
        foreignKey: 'hospital_staff_id',
        as: 'doctor'
      });
    }
  }

  HospitalStaffAvailability.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    hospitalStaffId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'hospital_staff_id'
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 6 },
      field: 'day_of_week'
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time'
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_available'
    }
  }, {
    sequelize,
    modelName: 'HospitalStaffAvailability',
    tableName: 'hospital_staff_availability',
    underscored: true,
    timestamps: true
  });

  return HospitalStaffAvailability;
};
