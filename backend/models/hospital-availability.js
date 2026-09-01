'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HospitalAvailability extends Model {
    static associate(models) {
      HospitalAvailability.belongsTo(models.HospitalProfile, {
        foreignKey: 'hospital_profile_id',
        as: 'hospital'
      });
    }
  }

  HospitalAvailability.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    hospitalProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'hospital_profile_id'
    },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    modelName: 'HospitalAvailability',
    tableName: 'hospital_availability',
    underscored: true,
    timestamps: true
  });

  return HospitalAvailability;
};
