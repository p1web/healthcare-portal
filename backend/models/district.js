'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class District extends Model {
    static associate(models) {
      District.belongsTo(models.State, {
        foreignKey: 'state_id',
        as: 'state'
      });
    }
  }

  District.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    stateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'state_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'District',
    tableName: 'districts',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['state_id', 'name'] }]
  });

  return District;
};