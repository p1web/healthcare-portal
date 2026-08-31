'use strict';

// CR4: hospital-initiated affiliation now requires admin approval before the
// doctor is published at that hospital. New enum value on doctor_practices.status.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_doctor_practices_status" ADD VALUE IF NOT EXISTS 'pending_admin_approval'`
    );
  },

  async down(queryInterface) {
    // Postgres cannot drop enum values without recreating the type; leave the
    // value in place on rollback.
    await queryInterface.sequelize.query(
      `UPDATE doctor_practices SET status = 'inactive' WHERE status = 'pending_admin_approval'`
    );
  }
};
