// models/doctor-profile.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DoctorProfile extends Model {
    static associate(models) {
      DoctorProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      DoctorProfile.hasOne(models.Doctor, {
        foreignKey: 'doctor_profile_id',
        as: 'doctor'
      });

      DoctorProfile.belongsTo(models.Specialization, {
        foreignKey: 'specialization_id',
        as: 'specialization'
      });
    }
  }

  DoctorProfile.init({
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
    registrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'registration_number'
    },
    qualification: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    specializationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'specialization_id'
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'years_of_experience'
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'consultation_fee'
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
    modelName: 'DoctorProfile',
    tableName: 'doctor_profiles',
    underscored: true,
    timestamps: true
  });

  return DoctorProfile;
};