'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('doctor_profiles', 'qualification_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'qualifications', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addIndex('doctor_profiles', ['qualification_id']);
    await queryInterface.sequelize.query(`
      INSERT INTO qualifications (name, description, created_at, updated_at)
      SELECT DISTINCT BTRIM(doctor_profile.qualification), NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM doctor_profiles AS doctor_profile
      WHERE doctor_profile.qualification IS NOT NULL
        AND BTRIM(doctor_profile.qualification) <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM qualifications AS existing_qualification
          WHERE LOWER(BTRIM(existing_qualification.name)) = LOWER(BTRIM(doctor_profile.qualification))
        )
      ON CONFLICT (name) DO NOTHING
    `);
    await queryInterface.sequelize.query(`
      UPDATE doctor_profiles AS doctor_profile
      SET qualification_id = (
        SELECT qualification.id
        FROM qualifications AS qualification
        WHERE LOWER(BTRIM(doctor_profile.qualification)) = LOWER(BTRIM(qualification.name))
        ORDER BY qualification.id
        LIMIT 1
      )
      WHERE doctor_profile.qualification_id IS NULL
        AND doctor_profile.qualification IS NOT NULL
        AND BTRIM(doctor_profile.qualification) <> ''
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE doctor_profiles AS doctor_profile
      SET qualification = qualification.name
      FROM qualifications AS qualification
      WHERE doctor_profile.qualification_id = qualification.id
    `);
    await queryInterface.removeIndex('doctor_profiles', ['qualification_id']);
    await queryInterface.removeColumn('doctor_profiles', 'qualification_id');
  }
};