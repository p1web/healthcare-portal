// models/hospital-profile.js
'use strict';
const { Model } = require('sequelize');
const { PROFILE_REVIEW_STATUSES, isApprovedStatus } = require('../utils/providerReview');

module.exports = (sequelize, DataTypes) => {
  class HospitalProfile extends Model {
    static associate(models) {
      HospitalProfile.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      HospitalProfile.belongsTo(models.User, {
        foreignKey: 'reviewed_by_user_id',
        as: 'reviewedBy'
      });

      HospitalProfile.hasMany(models.DoctorPractice, {
        foreignKey: 'hospital_profile_id',
        as: 'practices'
      });

      if (models.HospitalStaff) {
        HospitalProfile.hasMany(models.HospitalStaff, {
          foreignKey: 'hospital_profile_id',
          as: 'staff'
        });
      }

      if (models.HospitalAvailability) {
        HospitalProfile.hasMany(models.HospitalAvailability, {
          foreignKey: 'hospital_profile_id',
          as: 'availability'
        });
      }

      if (models.Department) {
        HospitalProfile.hasMany(models.Department, {
          foreignKey: 'hospital_profile_id',
          as: 'departments'
        });
      }

      HospitalProfile.belongsToMany(models.Coupon, {
        through: 'coupon_hospitals',
        foreignKey: 'hospital_id',
        otherKey: 'coupon_id',
        as: 'coupons'
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
    hospitalName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'hospital_name'
    },
    hospitalEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'hospital_email'
    },
    hospitalPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'hospital_phone'
    },
    emergencyContactNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_contact_number'
    },
    hospitalAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'hospital_address'
    },
    hospitalCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'hospital_city'
    },
    hospitalState: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'hospital_state'
    },
    hospitalPincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'hospital_pincode'
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    registrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'registration_number'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    specialtyIds: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      field: 'specialty_ids'
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
    hospitalKind: {
      type: DataTypes.ENUM('solo_practice', 'multi_doctor'),
      allowNull: false,
      defaultValue: 'multi_doctor',
      field: 'hospital_kind'
    },
    hospitalCommissionPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 20.00,
      field: 'hospital_commission_percent'
    },
    defaultConsultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 500.00,
      field: 'default_consultation_fee'
    },
    consultationFeeMode: {
      type: DataTypes.ENUM('STANDARD', 'PER_DOCTOR'),
      allowNull: false,
      defaultValue: 'STANDARD',
      field: 'consultation_fee_mode'
    },
    acceptsBookings: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'accepts_bookings'
    },
    availabilityVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'availability_version'
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
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      defaultValue: 0
    },
    discount: {
      type: DataTypes.STRING(20),
      allowNull: true
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
    modelName: 'HospitalProfile',
    tableName: 'hospital_profiles',
    underscored: true,
    timestamps: true
  });

  return HospitalProfile;
};