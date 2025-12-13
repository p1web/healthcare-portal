"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("hospital_specialties", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "hospitals", key: "id" },
        onDelete: "CASCADE",
      },
      specialty_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "specialties", key: "id" },
        onDelete: "CASCADE",
      },
      is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });

    await queryInterface.addConstraint("hospital_specialties", {
      fields: ["hospital_id", "specialty_id"],
      type: "unique",
      name: "unique_hospital_specialty"
    });

    await queryInterface.addIndex("hospital_specialties", ["hospital_id"]);
    await queryInterface.addIndex("hospital_specialties", ["specialty_id"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("hospital_specialties");
  }
};
