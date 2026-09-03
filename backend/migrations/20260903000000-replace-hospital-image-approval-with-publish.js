'use strict';

/**
 * Public image approval was replaced with a self-service "published" flag
 * per image slot. Drop the approval columns (status / rejection_reason)
 * and introduce `profile_image_published` and `banner_image_published`.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('hospital_profiles', 'profile_image_status', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'profile_image_rejection_reason', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'banner_image_status', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'banner_image_rejection_reason', { transaction: t });

      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_hospital_profiles_profile_image_status";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_hospital_profiles_banner_image_status";',
        { transaction: t }
      );

      await queryInterface.addColumn('hospital_profiles', 'profile_image_published', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction: t });

      await queryInterface.addColumn('hospital_profiles', 'banner_image_published', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('hospital_profiles', 'profile_image_published', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'banner_image_published', { transaction: t });

      await queryInterface.addColumn('hospital_profiles', 'profile_image_status', {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('hospital_profiles', 'profile_image_rejection_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('hospital_profiles', 'banner_image_status', {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('hospital_profiles', 'banner_image_rejection_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
