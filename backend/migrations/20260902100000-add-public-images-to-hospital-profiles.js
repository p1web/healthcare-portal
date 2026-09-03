'use strict';

/**
 * Adds columns to hospital_profiles for public profile & banner images.
 * Each image slot carries its own admin approval status so uploads only
 * become visible on the public listing / detail pages after approval.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('hospital_profiles', 'profile_image_url', {
        type: Sequelize.STRING(500),
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('hospital_profiles', 'profile_image_status', {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('hospital_profiles', 'profile_image_rejection_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('hospital_profiles', 'profile_image_uploaded_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('hospital_profiles', 'banner_image_url', {
        type: Sequelize.STRING(500),
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

      await queryInterface.addColumn('hospital_profiles', 'banner_image_uploaded_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('hospital_profiles', 'profile_image_url', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'profile_image_status', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'profile_image_rejection_reason', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'profile_image_uploaded_at', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'banner_image_url', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'banner_image_status', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'banner_image_rejection_reason', { transaction: t });
      await queryInterface.removeColumn('hospital_profiles', 'banner_image_uploaded_at', { transaction: t });

      // Drop the auto-created ENUM types (PostgreSQL)
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_hospital_profiles_profile_image_status";',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_hospital_profiles_banner_image_status";',
        { transaction: t }
      );

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
