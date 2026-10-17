'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('provider_bank_accounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_role: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      encrypted_details: {
        type: Sequelize.TEXT,
        allowNull: false
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

    await queryInterface.addConstraint('provider_bank_accounts', {
      fields: ['user_id', 'user_role'],
      type: 'unique',
      name: 'provider_bank_accounts_user_role_unique'
    });
    await queryInterface.addConstraint('provider_bank_accounts', {
      fields: ['user_role'],
      type: 'check',
      where: { user_role: ['doctor', 'hospital'] },
      name: 'provider_bank_accounts_role_check'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('provider_bank_accounts');
  }
};