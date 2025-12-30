// models/hospital-profile.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HospitalProfile extends Model {
    static associate(models) {
      HospitalProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      HospitalProfile.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  HospitalProfile.init({
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
    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'hospital_id'
    },
    registrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'registration_number'
    },
    establishedYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'established_year'
    },
    totalBeds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'total_beds'
    },
    hospitalType: {
      type: DataTypes.ENUM('private', 'government', 'charity', 'clinic'),
      allowNull: true,
      field: 'hospital_type'
    },
    operatingHours: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'operating_hours'
    },
    emergencyServices: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'emergency_services'
    },
    ambulanceServices: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'ambulance_services'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    verificationDocuments: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'verification_documents',
      get() {
        const rawValue = this.getDataValue('verificationDocuments');
        return rawValue ? (Array.isArray(rawValue) ? rawValue : JSON.parse(rawValue)) : [];
      }
    }
  }, {
    sequelize,
    modelName: 'HospitalProfile',
    tableName: 'hospital_profiles',
    underscored: true,
    timestamps: true
  });

  return HospitalProfile;
};