'use strict';

// Final cleanup: doctor_profiles.hospital_id and consultation_fee moved to
// doctor_practices per the Practo-style redesign. All controllers now read
// from doctor_practices (see Phase 3 + Phase D memory notes). See
// backend/migrations/20260828100200-create-doctor-practices.js and
// backend/migrations/20260828100300-backfill-doctor-practices.js.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE doctor_profiles DROP CONSTRAINT IF EXISTS doctor_profiles_hospital_id_fkey`
    );
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS doctor_profiles_hospital_id`
    );
    await queryInterface.removeColumn('doctor_profiles', 'hospital_id');
    await queryInterface.removeColumn('doctor_profiles', 'consultation_fee');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('doctor_profiles', 'consultation_fee', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('doctor_profiles', 'hospital_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'hospital_profiles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addIndex('doctor_profiles', ['hospital_id']);
    // Back-populate from each doctor's primary practice.
    await queryInterface.sequelize.query(`
      UPDATE doctor_profiles dp
      SET hospital_id = dpr.hospital_profile_id,
          consultation_fee = dpr.consultation_fee
      FROM doctor_practices dpr
      WHERE dpr.doctor_profile_id = dp.id
        AND dpr.is_primary = TRUE
    `);
  }
};
