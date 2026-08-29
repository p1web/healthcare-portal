'use strict';

// Backfill: create doctor_practices rows from existing doctor_profiles.hospital_id.
// Doctors with hospital_id IS NULL get an auto-created solo_practice hospital
// owned by their own user_id. Doctors whose linked hospital is owned by
// themselves get commission_mode = 'single' (also mark hospital solo).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [settingsRows] = await queryInterface.sequelize.query(
        `SELECT default_solo_commission_percent,
                default_split_platform_commission_percent,
                default_split_hospital_commission_percent,
                default_split_doctor_commission_percent
         FROM platform_commission_settings
         ORDER BY id ASC LIMIT 1`,
        { transaction }
      );
      const defaults = settingsRows[0] || {
        default_solo_commission_percent: 15,
        default_split_platform_commission_percent: 10,
        default_split_hospital_commission_percent: 15,
        default_split_doctor_commission_percent: 75
      };

      // 1. Auto-create solo_practice hospital_profile for doctors with no hospital.
      const [orphanDoctors] = await queryInterface.sequelize.query(
        `SELECT dp.id            AS doctor_profile_id,
                dp.user_id       AS user_id,
                dp.consultation_fee,
                u.name           AS user_name,
                u.email          AS user_email,
                u.phone          AS user_phone
         FROM doctor_profiles dp
         JOIN users u ON u.id = dp.user_id
         WHERE dp.hospital_id IS NULL`,
        { transaction }
      );

      for (const d of orphanDoctors) {
        const soloName = `${d.user_name || 'Doctor'}'s Clinic`;
        const [inserted] = await queryInterface.sequelize.query(
          `INSERT INTO hospital_profiles
             (user_id, hospital_name, hospital_email, hospital_phone,
              hospital_kind, verification_status, specialty_ids,
              rating, discount, created_at, updated_at)
           VALUES
             (:user_id, :name, :email, :phone,
              'solo_practice', 'approved', '[]'::jsonb,
              0, NULL, NOW(), NOW())
           RETURNING id`,
          {
            replacements: {
              user_id: d.user_id,
              name: soloName,
              email: d.user_email,
              phone: d.user_phone
            },
            transaction
          }
        );
        const newHospitalId = inserted[0].id;
        await queryInterface.sequelize.query(
          `UPDATE doctor_profiles SET hospital_id = :hid WHERE id = :did`,
          { replacements: { hid: newHospitalId, did: d.doctor_profile_id }, transaction }
        );
      }

      // 2. Mark hospitals as solo_practice where owner == doctor.
      await queryInterface.sequelize.query(
        `UPDATE hospital_profiles hp
         SET hospital_kind = 'solo_practice'
         FROM doctor_profiles dp
         WHERE dp.hospital_id = hp.id
           AND dp.user_id = hp.user_id
           AND hp.hospital_kind <> 'solo_practice'`,
        { transaction }
      );

      // 3. Create one practice row per doctor_profile (primary + active).
      await queryInterface.sequelize.query(
        `INSERT INTO doctor_practices
           (doctor_profile_id, hospital_profile_id, consultation_fee,
            is_primary, is_active, status,
            commission_mode,
            platform_commission_percent,
            hospital_commission_percent,
            doctor_commission_percent,
            commission_overridden,
            created_at, updated_at)
         SELECT
           dp.id,
           dp.hospital_id,
           COALESCE(dp.consultation_fee, 0),
           TRUE,
           TRUE,
           'active',
           CASE
             WHEN hp.hospital_kind = 'solo_practice' OR hp.user_id = dp.user_id
               THEN 'single'::"enum_doctor_practices_commission_mode"
             ELSE 'split'::"enum_doctor_practices_commission_mode"
           END,
           CASE
             WHEN hp.hospital_kind = 'solo_practice' OR hp.user_id = dp.user_id
               THEN CAST(:solo_platform AS DECIMAL(5,2))
             ELSE CAST(:split_platform AS DECIMAL(5,2))
           END,
           CASE
             WHEN hp.hospital_kind = 'solo_practice' OR hp.user_id = dp.user_id
               THEN CAST(0 AS DECIMAL(5,2))
             ELSE CAST(:split_hospital AS DECIMAL(5,2))
           END,
           CASE
             WHEN hp.hospital_kind = 'solo_practice' OR hp.user_id = dp.user_id
               THEN CAST(0 AS DECIMAL(5,2))
             ELSE CAST(:split_doctor AS DECIMAL(5,2))
           END,
           FALSE,
           NOW(), NOW()
         FROM doctor_profiles dp
         JOIN hospital_profiles hp ON hp.id = dp.hospital_id
         WHERE NOT EXISTS (
           SELECT 1 FROM doctor_practices dpr WHERE dpr.doctor_profile_id = dp.id
         )`,
        {
          replacements: {
            solo_platform: defaults.default_solo_commission_percent,
            split_platform: defaults.default_split_platform_commission_percent,
            split_hospital: defaults.default_split_hospital_commission_percent,
            split_doctor: defaults.default_split_doctor_commission_percent
          },
          transaction
        }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`DELETE FROM doctor_practices`, { transaction });
      // Solo hospitals created here can't be safely deleted (may have gained
      // dependents). Leave them; hospital_kind was informative, not destructive.
    });
  }
};
