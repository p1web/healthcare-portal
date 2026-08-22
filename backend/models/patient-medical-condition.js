// models/patient-medical-condition.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PatientMedicalCondition extends Model {
    static associate(models) {
      PatientMedicalCondition.belongsTo(models.PatientProfile, {
        foreignKey: 'patientProfileId',
        as: 'patientProfile'
      });
    }
  }

  PatientMedicalCondition.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    patientProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_profile_id'
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'resolved', 'chronic'),
      allowNull: false,
      defaultValue: 'active'
    },
    diagnosedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'diagnosed_date'
    },
    resolvedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'resolved_date'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'PatientMedicalCondition',
    tableName: 'patient_medical_conditions',
    underscored: true,
    timestamps: true
  });

  return PatientMedicalCondition;
};
