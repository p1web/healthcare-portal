'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DoctorAvailability extends Model {
    static associate(models) {
      DoctorAvailability.belongsTo(models.DoctorProfile, {
        foreignKey: 'doctor_profile_id',
        as: 'doctorProfile'
      });
    }
  }

  DoctorAvailability.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      doctor_profile_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      day_of_week: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: {
          min: 0,
          max: 6
        }
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false
      },
      is_available: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'DoctorAvailability',
      tableName: 'doctor_availability',
      underscored: true,
      timestamps: true
    }
  );

  return DoctorAvailability;
};
