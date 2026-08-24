'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        UPDATE users
        SET is_active = FALSE,
            is_blocked = TRUE
        WHERE is_active = FALSE
           OR is_blocked = TRUE
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE doctors d
        SET is_published = FALSE
        FROM doctor_profiles dp
        JOIN users u ON u.id = dp.user_id
        WHERE d.doctor_profile_id = dp.id
          AND u.is_blocked = TRUE
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE hospitals h
        SET is_published = FALSE
        FROM hospital_profiles hp
        JOIN users u ON u.id = hp.user_id
        WHERE hp.hospital_id = h.id
          AND u.is_blocked = TRUE
      `, { transaction });
    });
  },

  async down() {
    // Account intent cannot be reconstructed after normalization.
  }
};
