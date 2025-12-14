'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Specialization extends Model {
    static associate(models) {
      // associations can be defined here
      // Example: Specialization hasMany Doctors
      Specialization.hasMany(models.Doctor, {
        foreignKey: 'specialization_id',
        as: 'doctors'
      });
    }
  }
  Specialization.init({
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
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Specialization',
    tableName: 'specializations',
    underscored: true,
    timestamps: false
  });
  return Specialization;
};
