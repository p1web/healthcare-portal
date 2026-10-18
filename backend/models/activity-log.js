'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ActivityLog extends Model {
    static associate(models) {
      ActivityLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'actor'
      });
    }
  }

  ActivityLog.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    },
    subjectUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'subject_user_id'
    },
    actorRole: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'actor_role'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    actionType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'action_type'
    },
    result: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'success'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    entityType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'entity_type'
    },
    entityId: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'entity_id'
    },
    requestId: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'request_id'
    },
    httpMethod: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'http_method'
    },
    requestPath: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      field: 'request_path'
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      field: 'ip_address'
    },
    browser: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    sqlQuery: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'sql_query'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'activity_logs',
    timestamps: false
  });

  return ActivityLog;
};