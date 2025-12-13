"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("specialties", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), unique: true, allowNull: false },
      description: Sequelize.TEXT,
      icon: Sequelize.STRING(50),
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("specialties");
  }
};
