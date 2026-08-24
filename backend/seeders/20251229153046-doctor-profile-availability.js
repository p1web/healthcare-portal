'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO doctor_availability (
        doctor_profile_id,
        day_of_week,
        start_time,
        end_time,
        is_available,
        created_at,
        updated_at
      )
      SELECT
        doctor_profiles.id,
        schedule.day_of_week,
        schedule.start_time::time,
        schedule.end_time::time,
        TRUE,
        NOW(),
        NOW()
      FROM doctor_profiles
      JOIN (VALUES
        (4, 1, '09:00', '13:00'),
        (4, 2, '09:00', '13:00'),
        (4, 3, '14:00', '18:00'),
        (4, 4, '09:00', '13:00'),
        (4, 5, '14:00', '18:00'),
        (5, 1, '10:00', '16:00'),
        (5, 2, '10:00', '16:00'),
        (5, 4, '10:00', '16:00'),
        (5, 6, '09:00', '12:00')
      ) AS schedule(user_id, day_of_week, start_time, end_time)
        ON schedule.user_id = doctor_profiles.user_id
      ON CONFLICT (doctor_profile_id, day_of_week) DO NOTHING
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM doctor_availability
      USING doctor_profiles
      WHERE doctor_availability.doctor_profile_id = doctor_profiles.id
        AND doctor_profiles.user_id IN (4, 5)
    `);
  }
};
