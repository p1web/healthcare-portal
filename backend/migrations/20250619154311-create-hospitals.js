"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("hospitals", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      location: Sequelize.STRING,
      address: Sequelize.TEXT,
      phone: Sequelize.STRING(20),
      email: Sequelize.STRING,
      rating: {
        type: Sequelize.DECIMAL(2,1),
        defaultValue: 0.0,
      },
      discount: Sequelize.STRING(10),
      description: Sequelize.TEXT,
      beds: Sequelize.INTEGER,
      registration_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      established: Sequelize.INTEGER,
      operating_hours: Sequelize.STRING(100),
      hospital_type: { type: Sequelize.ENUM('private', 'government', 'charity', 'clinic'),
        allowNull: true
      },
      emergency_available: { type: Sequelize.BOOLEAN, defaultValue: false },
      ambulance_available: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verification_documents: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
    });

    await queryInterface.addIndex("hospitals", ["name"]);
    await queryInterface.addIndex("hospitals", ["location"]);
    await queryInterface.addIndex("hospitals", ["rating"]);
    await queryInterface.addIndex("hospitals", ["ambulance_available"]);
    await queryInterface.addIndex('hospitals', ['registration_number']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("hospitals");
  }
};
