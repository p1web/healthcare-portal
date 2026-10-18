'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      subject_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      actor_role: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      action_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      result: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'success'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      entity_type: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      entity_id: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      request_id: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      http_method: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      request_path: {
        type: Sequelize.STRING(2048),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      browser: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sql_query: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('activity_logs', ['user_id', 'created_at'], {
      name: 'activity_logs_user_created_at_idx'
    });
    await queryInterface.addIndex('activity_logs', ['action_type', 'created_at'], {
      name: 'activity_logs_action_created_at_idx'
    });
    await queryInterface.addIndex('activity_logs', ['category', 'created_at'], {
      name: 'activity_logs_category_created_at_idx'
    });
    await queryInterface.addIndex('activity_logs', ['entity_type', 'entity_id'], {
      name: 'activity_logs_entity_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activity_logs');
  }
};