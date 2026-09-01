'use strict';

// Post-CR5 cleanup: no controller can create a `pending_admin_approval` row
// anymore (CR4 doctor-initiated affiliations and CR5 hospital-initiated
// affiliations are both retired). Drop the enum value from the type.
//
// Postgres requires recreating the enum type to remove a value, so we:
//   1. Coerce any leftover rows to 'inactive'.
//   2. Drop the column default (it references the old type).
//   3. Rename the old type, create the new type, cast the column across.
//   4. Restore the default and drop the old type.
module.exports = {
  async up(queryInterface) {
    const sql = queryInterface.sequelize;

    await sql.query(
      `UPDATE doctor_practices SET status = 'inactive' WHERE status = 'pending_admin_approval'`
    );

    await sql.query(`ALTER TABLE doctor_practices ALTER COLUMN status DROP DEFAULT`);

    await sql.query(
      `ALTER TYPE "enum_doctor_practices_status" RENAME TO "enum_doctor_practices_status_old"`
    );

    await sql.query(
      `CREATE TYPE "enum_doctor_practices_status" AS ENUM ('pending_hospital_approval', 'active', 'rejected', 'inactive')`
    );

    await sql.query(
      `ALTER TABLE doctor_practices
         ALTER COLUMN status TYPE "enum_doctor_practices_status"
         USING status::text::"enum_doctor_practices_status"`
    );

    await sql.query(
      `ALTER TABLE doctor_practices ALTER COLUMN status SET DEFAULT 'active'`
    );

    await sql.query(`DROP TYPE "enum_doctor_practices_status_old"`);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_doctor_practices_status" ADD VALUE IF NOT EXISTS 'pending_admin_approval'`
    );
  }
};
