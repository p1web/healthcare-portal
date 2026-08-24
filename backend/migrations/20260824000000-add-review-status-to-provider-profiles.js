'use strict';

const REVIEW_STATUSES = ['draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'suspended'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('doctor_profiles', 'verification_status', {
      type: Sequelize.ENUM(...REVIEW_STATUSES),
      allowNull: false,
      defaultValue: 'draft'
    });
    await queryInterface.addColumn('doctor_profiles', 'submitted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('doctor_profiles', 'reviewed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('doctor_profiles', 'reviewed_by_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('doctor_profiles', 'review_notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('doctor_profiles', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('doctor_profiles', 'last_verified_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('hospital_profiles', 'verification_status', {
      type: Sequelize.ENUM(...REVIEW_STATUSES),
      allowNull: false,
      defaultValue: 'draft'
    });
    await queryInterface.addColumn('hospital_profiles', 'submitted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('hospital_profiles', 'reviewed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('hospital_profiles', 'reviewed_by_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('hospital_profiles', 'review_notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('hospital_profiles', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('hospital_profiles', 'last_verified_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE doctor_profiles
      SET verification_status = (CASE
        WHEN is_verified = TRUE THEN 'approved'
        WHEN verification_documents IS NOT NULL AND verification_documents::text <> '[]' THEN 'submitted'
        ELSE 'draft'
      END)::"enum_doctor_profiles_verification_status",
      submitted_at = CASE
        WHEN is_verified = FALSE AND verification_documents IS NOT NULL AND verification_documents::text <> '[]' THEN updated_at
        ELSE submitted_at
      END,
      reviewed_at = CASE WHEN is_verified = TRUE THEN updated_at ELSE NULL END,
      last_verified_at = CASE WHEN is_verified = TRUE THEN updated_at ELSE NULL END
    `);

    await queryInterface.sequelize.query(`
      UPDATE hospital_profiles
      SET verification_status = (CASE
        WHEN is_verified = TRUE THEN 'approved'
        WHEN verification_documents IS NOT NULL AND verification_documents::text <> '[]' THEN 'submitted'
        ELSE 'draft'
      END)::"enum_hospital_profiles_verification_status",
      submitted_at = CASE
        WHEN is_verified = FALSE AND verification_documents IS NOT NULL AND verification_documents::text <> '[]' THEN updated_at
        ELSE submitted_at
      END,
      reviewed_at = CASE WHEN is_verified = TRUE THEN updated_at ELSE NULL END,
      last_verified_at = CASE WHEN is_verified = TRUE THEN updated_at ELSE NULL END
    `);

    await queryInterface.addIndex('doctor_profiles', ['verification_status']);
    await queryInterface.addIndex('doctor_profiles', ['reviewed_by_user_id']);
    await queryInterface.addIndex('hospital_profiles', ['verification_status']);
    await queryInterface.addIndex('hospital_profiles', ['reviewed_by_user_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('hospital_profiles', ['reviewed_by_user_id']);
    await queryInterface.removeIndex('hospital_profiles', ['verification_status']);
    await queryInterface.removeIndex('doctor_profiles', ['reviewed_by_user_id']);
    await queryInterface.removeIndex('doctor_profiles', ['verification_status']);

    await queryInterface.removeColumn('hospital_profiles', 'last_verified_at');
    await queryInterface.removeColumn('hospital_profiles', 'rejection_reason');
    await queryInterface.removeColumn('hospital_profiles', 'review_notes');
    await queryInterface.removeColumn('hospital_profiles', 'reviewed_by_user_id');
    await queryInterface.removeColumn('hospital_profiles', 'reviewed_at');
    await queryInterface.removeColumn('hospital_profiles', 'submitted_at');
    await queryInterface.removeColumn('hospital_profiles', 'verification_status');

    await queryInterface.removeColumn('doctor_profiles', 'last_verified_at');
    await queryInterface.removeColumn('doctor_profiles', 'rejection_reason');
    await queryInterface.removeColumn('doctor_profiles', 'review_notes');
    await queryInterface.removeColumn('doctor_profiles', 'reviewed_by_user_id');
    await queryInterface.removeColumn('doctor_profiles', 'reviewed_at');
    await queryInterface.removeColumn('doctor_profiles', 'submitted_at');
    await queryInterface.removeColumn('doctor_profiles', 'verification_status');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_doctor_profiles_verification_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_hospital_profiles_verification_status";');
  }
};