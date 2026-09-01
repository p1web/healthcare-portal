'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    static associate(models) {
      Appointment.belongsTo(models.DoctorProfile, {
        foreignKey: 'doctor_profile_id',
        as: 'doctorProfile'
      });
      Appointment.belongsTo(models.User, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      if (models.DoctorPractice) {
        Appointment.belongsTo(models.DoctorPractice, {
          foreignKey: 'practice_id',
          as: 'practice'
        });
      }
      if (models.HospitalProfile) {
        Appointment.belongsTo(models.HospitalProfile, {
          foreignKey: 'hospital_profile_id',
          as: 'hospitalProfile'
        });
      }
      if (models.Coupon) {
        Appointment.belongsTo(models.Coupon.unscoped(), {
          foreignKey: 'coupon_id',
          as: 'coupon'
        });
      }
    }
  }

  Appointment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    doctorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'doctor_profile_id'
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
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'rejected'),
      defaultValue: 'pending'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason'
    },
    couponCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'coupon_code'
    },
    couponId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'coupon_id'
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'original_price'
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'discount_amount'
    },
    finalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'final_price'
    },
    practiceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'practice_id'
    },
    hospitalProfileId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'hospital_profile_id'
    },
    platformRevenueAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'platform_revenue_amount'
    },
    doctorPayoutAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'doctor_payout_amount'
    },
    paymentMode: {
      type: DataTypes.ENUM('online', 'offline'),
      allowNull: false,
      defaultValue: 'offline',
      field: 'payment_mode'
    },
    paymentStatus: {
      type: DataTypes.ENUM('paid', 'pending', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'payment_status'
    },
    bookingNumber: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      field: 'booking_number'
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at'
    },
    paymentTransactionId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'payment_transaction_id'
    },
    cashbackStatus: {
      type: DataTypes.ENUM('none', 'pending', 'issued', 'forfeited'),
      allowNull: false,
      defaultValue: 'none',
      field: 'cashback_status'
    },
    cashbackIssuedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cashback_issued_at'
    },
    cashbackTransactionId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'cashback_transaction_id'
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
