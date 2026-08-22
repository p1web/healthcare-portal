'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Patient-specific profile data
    await queryInterface.createTable('patient_profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      blood_group: {
        type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
        allowNull: true
      },
      height: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Height in cm'
      },
      weight: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Weight in kg'
      },
      allergies: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of allergies'
      },
      medical_conditions: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of existing conditions'
      },
      emergency_contact_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      emergency_contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      emergency_contact_relation: {
        type: Sequelize.STRING(50),
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

    // Doctor-specific profile data
    await queryInterface.createTable('doctor_profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Link to doctors table for consultation details'
      },
      registration_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'Medical registration number'
      },
      qualification: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      specialization_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'specializations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      years_of_experience: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      consultation_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Admin verification status'
      },
      verification_documents: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of document URLs'
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

    // Hospital-specific profile data
    await queryInterface.createTable('hospital_profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'hospitals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Link to hospitals table'
      },
      registration_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      established_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      total_beds: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      hospital_type: {
        type: Sequelize.ENUM('private', 'government', 'charity', 'clinic'),
        allowNull: true
      },
      operating_hours: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      emergency_services: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ambulance_services: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verification_documents: {
        type: Sequelize.JSON,
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

    // Add indexes
    await queryInterface.addIndex('patient_profiles', ['user_id']);
    await queryInterface.addIndex('doctor_profiles', ['user_id']);
    await queryInterface.addIndex('doctor_profiles', ['doctor_id']);
    await queryInterface.addIndex('doctor_profiles', ['registration_number']);
    await queryInterface.addIndex('hospital_profiles', ['user_id']);
    await queryInterface.addIndex('hospital_profiles', ['hospital_id']);
    await queryInterface.addIndex('hospital_profiles', ['registration_number']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('hospital_profiles');
    await queryInterface.dropTable('doctor_profiles');
    await queryInterface.dropTable('patient_profiles');
  }
};
