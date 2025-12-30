// models/user.js
'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Has one profile based on role
      User.hasOne(models.PatientProfile, {
        foreignKey: 'user_id',
        as: 'patientProfile'
      });

      User.hasOne(models.DoctorProfile, {
        foreignKey: 'user_id',
        as: 'doctorProfile'
      });

      User.hasOne(models.HospitalProfile, {
        foreignKey: 'user_id',
        as: 'hospitalProfile'
      });
    }

    // Instance method to check password
    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Instance method to generate verification token
    generateVerificationToken() {
      const crypto = require('crypto');
      return crypto.randomBytes(32).toString('hex');
    }

    // Instance method to generate OTP
    generateOTP() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Hide sensitive data when converting to JSON
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      delete values.email_verification_token;
      delete values.phone_verification_token;
      delete values.reset_password_token;
      return values;
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: {
          args: [2, 255],
          msg: 'Name must be between 2 and 255 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        msg: 'Email already exists'
      },
      validate: {
        isEmail: { msg: 'Invalid email format' }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: {
        msg: 'Phone number already exists'
      },
      validate: {
        is: {
          args: /^[0-9]{10}$/,
          msg: 'Phone must be 10 digits'
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('patient', 'doctor', 'hospital', 'admin'),
      allowNull: false,
      defaultValue: 'patient',
      field: 'role'
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_email_verified'
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_phone_verified'
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email_verification_token'
    },
    phoneVerificationToken: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'phone_verification_token'
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reset_password_token'
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_password_expires'
    },
    profileImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_image'
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'date_of_birth'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'India'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_blocked'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    termsAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'terms_accepted_at'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    hooks: {
      // Hash password before creating user
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // Hash password before updating if password changed
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  return User;
};