'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Qualification extends Model {
    static associate() {}
  }

  Qualification.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Qualification',
    tableName: 'qualifications',
    underscored: true,
    timestamps: true
  });

  return Qualification;
};
