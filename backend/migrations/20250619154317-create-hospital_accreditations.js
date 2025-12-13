"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("hospital_accreditations", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "hospitals", key: "id" },
        onDelete: "CASCADE",
      },
      accreditation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "accreditations", key: "id" },
        onDelete: "CASCADE",
      },
      certified_date: Sequelize.DATEONLY,
      expiry_date: Sequelize.DATEONLY,
      certificate_number: Sequelize.STRING(100),
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });

    await queryInterface.addConstraint("hospital_accreditations", {
      fields: ["hospital_id", "accreditation_id"],
      type: "unique",
      name: "unique_hospital_accreditation"
    });

    await queryInterface.addIndex("hospital_accreditations", ["hospital_id"]);
    await queryInterface.addIndex("hospital_accreditations", ["accreditation_id"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("hospital_accreditations");
  }
};
