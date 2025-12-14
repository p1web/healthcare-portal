'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add specialization_id column
    await queryInterface.addColumn('doctors', 'specialization_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'specializations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // or 'CASCADE' depending on your logic
    });

    // Optional: remove old specialty_id column if no longer needed
    await queryInterface.removeColumn('doctors', 'specialty_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('doctors', 'specialty_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.removeColumn('doctors', 'specialization_id');
  }
};
