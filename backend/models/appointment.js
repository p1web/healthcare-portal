'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    static associate(models) {
      Appointment.belongsTo(models.Doctor, {
        foreignKey: 'doctor_id',
        as: 'doctor'
      });
      Appointment.belongsTo(models.User, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
    }
  }

  Appointment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id'
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_id'
    },
    patientName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'patient_name'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'appointment_date'
    },
    appointmentTime: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'appointment_time'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'pending'
    },
    couponCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'coupon_code'
    }
  }, {
    sequelize,
    modelName: 'Appointment',
    tableName: 'appointments',
    underscored: true,
    timestamps: true
  });

  return Appointment;
};
