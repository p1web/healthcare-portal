'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class State extends Model {
    static associate(models) {
      State.hasMany(models.District, {
        foreignKey: 'state_id',
        as: 'districts'
      });
    }
  }

  State.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'State',
    tableName: 'states',
    underscored: true,
    timestamps: true
  });

  return State;
};