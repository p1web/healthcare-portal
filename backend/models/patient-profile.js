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
    allergies: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('allergies');
        return rawValue ? (Array.isArray(rawValue) ? rawValue : JSON.parse(rawValue)) : [];
      }
    },
    medicalConditions: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'medical_conditions',
      get() {
        const rawValue = this.getDataValue('medicalConditions');
        return rawValue ? (Array.isArray(rawValue) ? rawValue : JSON.parse(rawValue)) : [];
      }
    },
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