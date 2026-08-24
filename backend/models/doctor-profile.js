// models/doctor-profile.js
'use strict';
const { Model } = require('sequelize');
const { PROFILE_REVIEW_STATUSES, isApprovedStatus } = require('../utils/providerReview');

module.exports = (sequelize, DataTypes) => {
  class DoctorProfile extends Model {
    static associate(models) {
      DoctorProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      DoctorProfile.belongsTo(models.User, {
        foreignKey: 'reviewed_by_user_id',
        as: 'reviewedBy'
      });

      DoctorProfile.hasMany(models.DoctorAvailability, {
        foreignKey: 'doctor_profile_id',
        as: 'availabilities'
      });

      DoctorProfile.hasMany(models.Appointment, {
        foreignKey: 'doctor_profile_id',
        as: 'appointments'
      });

      DoctorProfile.belongsTo(models.Specialization, {
        foreignKey: 'specialization_id',
        as: 'specialization'
      });

      DoctorProfile.belongsTo(models.HospitalProfile, {
        foreignKey: 'hospital_id',
        as: 'hospital'
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
    hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'hospital_id'
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
    verificationStatus: {
      type: DataTypes.ENUM(
        PROFILE_REVIEW_STATUSES.DRAFT,
        PROFILE_REVIEW_STATUSES.SUBMITTED,
        PROFILE_REVIEW_STATUSES.UNDER_REVIEW,
        PROFILE_REVIEW_STATUSES.CHANGES_REQUESTED,
        PROFILE_REVIEW_STATUSES.APPROVED,
        PROFILE_REVIEW_STATUSES.REJECTED,
        PROFILE_REVIEW_STATUSES.SUSPENDED
      ),
      allowNull: false,
      defaultValue: PROFILE_REVIEW_STATUSES.DRAFT,
      field: 'verification_status'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at'
    },
    reviewedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewed_by_user_id'
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_notes'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason'
    },
    lastVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_verified_at'
    },
    isVerified: {
      type: DataTypes.VIRTUAL,
      get() {
        return isApprovedStatus(this.getDataValue('verificationStatus'));
      }
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