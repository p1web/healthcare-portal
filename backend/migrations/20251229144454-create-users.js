'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Hashed password'
      },
      role: {
        type: Sequelize.ENUM('patient', 'doctor', 'hospital', 'admin'),
        allowNull: false,
        defaultValue: 'patient'
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone_verification_token: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      reset_password_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      reset_password_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      profile_image: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATE,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        defaultValue: 'India'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      terms_accepted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['phone']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['email_verification_token']);
    await queryInterface.addIndex('users', ['reset_password_token']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
