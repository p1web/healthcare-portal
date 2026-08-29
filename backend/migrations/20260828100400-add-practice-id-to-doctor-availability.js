'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('doctor_availability', 'practice_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'doctor_practices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      await queryInterface.sequelize.query(
        `UPDATE doctor_availability da
         SET practice_id = dpr.id
         FROM doctor_practices dpr
         WHERE dpr.doctor_profile_id = da.doctor_profile_id
           AND dpr.is_primary = TRUE`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `DELETE FROM doctor_availability WHERE practice_id IS NULL`,
        { transaction }
      );

      await queryInterface.changeColumn('doctor_availability', 'practice_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'doctor_practices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      await queryInterface.addIndex('doctor_availability', ['practice_id'], {
        name: 'doctor_availability_practice_id_idx',
        transaction
      });

      // Drop old (doctor_profile_id, day_of_week) uniqueness; add practice-scoped uniqueness.
      await queryInterface.sequelize.query(
        `ALTER TABLE doctor_availability DROP CONSTRAINT IF EXISTS unique_doctor_profile_day`,
        { transaction }
      );
      await queryInterface.addConstraint('doctor_availability', {
        fields: ['practice_id', 'day_of_week'],
        type: 'unique',
        name: 'unique_practice_day',
        transaction
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('doctor_availability', 'unique_practice_day', { transaction });
      await queryInterface.removeIndex('doctor_availability', 'doctor_availability_practice_id_idx', { transaction });
      await queryInterface.removeColumn('doctor_availability', 'practice_id', { transaction });
      await queryInterface.addConstraint('doctor_availability', {
        fields: ['doctor_profile_id', 'day_of_week'],
        type: 'unique',
        name: 'unique_doctor_profile_day',
        transaction
      });
    });
  }
};
