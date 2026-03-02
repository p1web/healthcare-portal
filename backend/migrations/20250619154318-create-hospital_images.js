"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("hospital_images", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      hospital_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "hospitals", key: "id" },
        onDelete: "CASCADE",
      },
      image_url: { type: Sequelize.TEXT, allowNull: false },
      image_type: { type: Sequelize.TEXT, allowNull: false },
      title: Sequelize.STRING,
      description: Sequelize.TEXT,
      display_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });

    await queryInterface.addIndex("hospital_images", ["hospital_id"]);
    await queryInterface.addIndex("hospital_images", ["image_type"]);
    await queryInterface.addIndex("hospital_images", ["is_primary"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("hospital_images");
  }
};
