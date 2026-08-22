'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patient_medical_conditions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patient_profile_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'patient_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'resolved', 'chronic'),
        allowNull: false,
        defaultValue: 'active'
      },
      diagnosed_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      resolved_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('patient_medical_conditions', ['patient_profile_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('patient_medical_conditions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_patient_medical_conditions_status";');
  }
};
