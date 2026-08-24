'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('doctor_profiles', 'hospital_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'hospitals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('doctor_profiles', ['hospital_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('doctor_profiles', ['hospital_id']);
    await queryInterface.removeColumn('doctor_profiles', 'hospital_id');
  }
};
