'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('doctor_availability', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      day_of_week: {
        type: Sequelize.SMALLINT,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('doctor_availability', ['doctor_id']);
    await queryInterface.addIndex('doctor_availability', ['day_of_week']);

    // Add unique constraint for doctor_id + day_of_week
    await queryInterface.addConstraint('doctor_availability', {
      fields: ['doctor_id', 'day_of_week'],
      type: 'unique',
      name: 'unique_doctor_day'
    });

    await queryInterface.addConstraint('doctor_availability', {
      fields: ['day_of_week'],
      type: 'check',
      where: {
        day_of_week: {
          [Sequelize.Op.between]: [0, 6]
        }
      },
      name: 'check_day_of_week_range'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('doctor_availability');
  }
};
