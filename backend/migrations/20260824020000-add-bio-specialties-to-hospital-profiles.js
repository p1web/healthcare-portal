'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('hospital_profiles', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('hospital_profiles', 'specialty_ids', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('hospital_profiles', 'specialty_ids');
    await queryInterface.removeColumn('hospital_profiles', 'bio');
  }
};
