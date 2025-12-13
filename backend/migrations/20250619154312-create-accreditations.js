"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("accreditations", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), unique: true, allowNull: false },
      full_name: Sequelize.STRING(255),
      description: Sequelize.TEXT,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("accreditations");
  }
};
