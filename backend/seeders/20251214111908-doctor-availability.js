'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('doctor_availability', [
      // Dr. Rajesh Kumar (1)
      { doctor_id: 1, day_of_week: 1, start_time: '09:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 1, day_of_week: 2, start_time: '09:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 1, day_of_week: 3, start_time: '09:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 1, day_of_week: 4, start_time: '09:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 1, day_of_week: 5, start_time: '09:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },

      // Dr. Priya Sharma (2)
      { doctor_id: 2, day_of_week: 2, start_time: '10:00', end_time: '18:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 2, day_of_week: 3, start_time: '10:00', end_time: '18:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 2, day_of_week: 4, start_time: '10:00', end_time: '18:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 2, day_of_week: 5, start_time: '10:00', end_time: '18:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 2, day_of_week: 6, start_time: '10:00', end_time: '14:00', created_at: new Date(), updated_at: new Date() },

      // Dr. Amit Patel (3)
      { doctor_id: 3, day_of_week: 1, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 3, day_of_week: 2, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 3, day_of_week: 3, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 3, day_of_week: 4, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 3, day_of_week: 5, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 3, day_of_week: 6, start_time: '08:00', end_time: '13:00', created_at: new Date(), updated_at: new Date() },

      // Dr. Sneha Desai (4)
      { doctor_id: 4, day_of_week: 3, start_time: '11:00', end_time: '19:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 4, day_of_week: 4, start_time: '11:00', end_time: '19:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 4, day_of_week: 5, start_time: '11:00', end_time: '19:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 4, day_of_week: 6, start_time: '11:00', end_time: '19:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 4, day_of_week: 0, start_time: '10:00', end_time: '15:00', created_at: new Date(), updated_at: new Date() },

      // Dr. Vikram Singh (5)
      { doctor_id: 5, day_of_week: 1, start_time: '09:00', end_time: '18:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 5, day_of_week: 2, start_time: '09:00', end_time: '18:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 5, day_of_week: 3, start_time: '09:00', end_time: '18:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 5, day_of_week: 4, start_time: '09:00', end_time: '18:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 5, day_of_week: 5, start_time: '09:00', end_time: '18:00', created_at: new Date(), updated_at: new Date() },

      // Dr. Kavita Menon (6)
      { doctor_id: 6, day_of_week: 1, start_time: '10:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 6, day_of_week: 2, start_time: '10:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 6, day_of_week: 3, start_time: '10:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 6, day_of_week: 4, start_time: '10:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 6, day_of_week: 5, start_time: '10:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 6, day_of_week: 6, start_time: '10:00', end_time: '14:00', created_at: new Date(), updated_at: new Date() },

      // Dr. Arjun Reddy (7)
      { doctor_id: 7, day_of_week: 1, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 7, day_of_week: 2, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 7, day_of_week: 3, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 7, day_of_week: 4, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 7, day_of_week: 5, start_time: '08:00', end_time: '16:00', created_at: new Date(), updated_at: new Date() },

      // Dr. Neha Gupta (8)
      { doctor_id: 8, day_of_week: 2, start_time: '09:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 8, day_of_week: 3, start_time: '09:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 8, day_of_week: 4, start_time: '09:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 8, day_of_week: 5, start_time: '09:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 8, day_of_week: 6, start_time: '09:00', end_time: '13:00', created_at: new Date(), updated_at: new Date() },

      // Dr. Ananya Krishnan (10)
      { doctor_id: 10, day_of_week: 1, start_time: '08:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 10, day_of_week: 2, start_time: '08:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 10, day_of_week: 3, start_time: '08:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 10, day_of_week: 4, start_time: '08:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() },
      { doctor_id: 10, day_of_week: 5, start_time: '08:00', end_time: '17:00', created_at: new Date(), updated_at: new Date() }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('doctor_availability', null, {});
  }
};
