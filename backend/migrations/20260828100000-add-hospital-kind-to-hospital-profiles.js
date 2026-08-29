'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('hospital_profiles', 'hospital_kind', {
        type: Sequelize.ENUM('solo_practice', 'multi_doctor'),
        allowNull: false,
        defaultValue: 'multi_doctor'
      }, { transaction });

      await queryInterface.addIndex('hospital_profiles', ['hospital_kind'], {
        name: 'hospital_profiles_hospital_kind_idx',
        transaction
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('hospital_profiles', 'hospital_profiles_hospital_kind_idx', { transaction });
      await queryInterface.removeColumn('hospital_profiles', 'hospital_kind', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_hospital_profiles_hospital_kind"', { transaction });
    });
  }
};
