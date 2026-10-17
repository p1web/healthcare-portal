'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProviderBankAccount extends Model {}

  ProviderBankAccount.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    userRole: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'user_role'
    },
    encryptedDetails: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'encrypted_details'
    }
  }, {
    sequelize,
    modelName: 'ProviderBankAccount',
    tableName: 'provider_bank_accounts',
    underscored: true,
    timestamps: true
  });

  return ProviderBankAccount;
};