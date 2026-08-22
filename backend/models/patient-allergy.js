// models/patient-allergy.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PatientAllergy extends Model {
    static associate(models) {
      PatientAllergy.belongsTo(models.PatientProfile, {
        foreignKey: 'patientProfileId',
        as: 'patientProfile'
      });
    }
  }

  PatientAllergy.init({
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
    severity: {
      type: DataTypes.ENUM('mild', 'moderate', 'severe'),
      allowNull: true
    },
    reaction: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'resolved'),
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
    modelName: 'PatientAllergy',
    tableName: 'patient_allergies',
    underscored: true,
    timestamps: true
  });

  return PatientAllergy;
};
