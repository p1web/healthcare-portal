"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("hospital_facilities", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "hospitals", key: "id" },
        onDelete: "CASCADE",
      },
      facility_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "facilities", key: "id" },
        onDelete: "CASCADE",
      },
      available_24x7: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });

    await queryInterface.addConstraint("hospital_facilities", {
      fields: ["hospital_id", "facility_id"],
      type: "unique",
      name: "unique_hospital_facility"
    });

    await queryInterface.addIndex("hospital_facilities", ["hospital_id"]);
    await queryInterface.addIndex("hospital_facilities", ["facility_id"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("hospital_facilities");
  }
};
