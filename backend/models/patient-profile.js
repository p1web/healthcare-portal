// models/patient-profile.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PatientProfile extends Model {
    static associate(models) {
      PatientProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      // History-tracked replacements for the legacy allergies/medical_conditions JSON columns
      PatientProfile.hasMany(models.PatientAllergy, {
        foreignKey: 'patientProfileId',
        as: 'allergies'
      });
      PatientProfile.hasMany(models.PatientMedicalCondition, {
        foreignKey: 'patientProfileId',
        as: 'medicalConditions'
      });
    }
  }

  PatientProfile.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'user_id'
    },
    bloodGroup: {
      type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
      allowNull: true,
      field: 'blood_group'
    },
    height: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    // NOTE: legacy `allergies` / `medical_conditions` JSON columns are no longer
    // mapped here. They have been superseded by the PatientAllergy and
    // PatientMedicalCondition tables (see `allergies`/`medicalConditions` associations
    // above), which track status (active/resolved) and dates over repeat visits.
    emergencyContactName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'emergency_contact_name'
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_contact_phone'
    },
    emergencyContactRelation: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'emergency_contact_relation'
    }
  }, {
    sequelize,
    modelName: 'PatientProfile',
    tableName: 'patient_profiles',
    underscored: true,
    timestamps: true
  });

  return PatientProfile;
};