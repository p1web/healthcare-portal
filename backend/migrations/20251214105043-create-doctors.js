'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('doctors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      doctorProfileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'doctor_profile_id',
        references: {
          model: 'doctor_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      specialtyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'specialty_id',
        references: {
          model: 'specialties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      hospitalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'hospital_id',
        references: {
          model: 'hospitals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      experience: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Years of experience'
      },
      rating: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: false,
        validate: {
          min: 0,
          max: 5
        }
      },
      fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Consultation fee'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      qualification: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      consultationDuration: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
        comment: 'Duration in minutes',
        field: 'consultation_duration'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_published'
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'published_at'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });

    await queryInterface.addIndex('doctors', ['name']);
    await queryInterface.addIndex('doctors', ['specialty_id']);
    await queryInterface.addIndex('doctors', ['hospital_id']);
    await queryInterface.addIndex('doctors', ['rating']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('doctors');

  }
};
