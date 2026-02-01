'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Doctor extends Model {
    static associate(models) {

      Doctor.belongsTo(models.DoctorProfile, {
        foreignKey: 'doctor_profile_id',
        as: 'profile'
      });

      // Each doctor belongs to a specialization
      Doctor.belongsTo(models.Specialization, {
        foreignKey: 'specialization_id',
        as: 'specialization'
      });

      // Example: doctor has many availabilities
      Doctor.hasMany(models.DoctorAvailability, {
        foreignKey: 'doctor_id',
        as: 'availabilities'
      });

      // Add other associations if needed, e.g., hospital
      Doctor.belongsTo(models.Hospital, {
        foreignKey: 'hospital_id',
        as: 'hospital'
      });
    }
  }

  Doctor.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    doctor_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'doctor_profiles',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    specialization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'specializations',
        key: 'id'
      }
    },
    hospital_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hospitals',
        key: 'id'
      }
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    fee: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    qualification: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    consultation_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30 // default in minutes
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true
    } 
  }, {
    sequelize,
    modelName: 'Doctor',
    tableName: 'doctors',
    underscored: true,
    timestamps: false
  });

  return Doctor;
};
