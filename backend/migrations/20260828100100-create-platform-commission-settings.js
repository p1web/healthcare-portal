'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('platform_commission_settings', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        default_solo_commission_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 15.00
        },
        default_split_platform_commission_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 10.00
        },
        default_split_hospital_commission_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 15.00
        },
        default_split_doctor_commission_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 75.00
        },
        updated_by_user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        }
      }, { transaction });

      await queryInterface.bulkInsert('platform_commission_settings', [{
        default_solo_commission_percent: 15.00,
        default_split_platform_commission_percent: 10.00,
        default_split_hospital_commission_percent: 15.00,
        default_split_doctor_commission_percent: 75.00,
        created_at: new Date(),
        updated_at: new Date()
      }], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('platform_commission_settings');
  }
};
