'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('doctor_practices', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        doctor_profile_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'doctor_profiles', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        hospital_profile_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'hospital_profiles', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        consultation_fee: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        // pending_hospital_approval | active | rejected | inactive
        status: {
          type: Sequelize.ENUM('pending_hospital_approval', 'active', 'rejected', 'inactive'),
          allowNull: false,
          defaultValue: 'active'
        },
        commission_mode: {
          type: Sequelize.ENUM('single', 'split'),
          allowNull: false,
          defaultValue: 'split'
        },
        platform_commission_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0
        },
        hospital_commission_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0
        },
        doctor_commission_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0
        },
        commission_overridden: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        }
      }, { transaction });

      await queryInterface.addConstraint('doctor_practices', {
        fields: ['doctor_profile_id', 'hospital_profile_id'],
        type: 'unique',
        name: 'doctor_practices_doctor_hospital_unique',
        transaction
      });

      await queryInterface.addIndex('doctor_practices', ['doctor_profile_id'], {
        name: 'doctor_practices_doctor_profile_id_idx',
        transaction
      });
      await queryInterface.addIndex('doctor_practices', ['hospital_profile_id'], {
        name: 'doctor_practices_hospital_profile_id_idx',
        transaction
      });
      await queryInterface.addIndex('doctor_practices', ['is_active'], {
        name: 'doctor_practices_is_active_idx',
        transaction
      });
      await queryInterface.addIndex('doctor_practices', ['status'], {
        name: 'doctor_practices_status_idx',
        transaction
      });

      // Only one primary practice per doctor
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX doctor_practices_one_primary_per_doctor
         ON doctor_practices (doctor_profile_id)
         WHERE is_primary = TRUE`,
        { transaction }
      );

      // Sum of split percents must not exceed 100
      await queryInterface.sequelize.query(
        `ALTER TABLE doctor_practices
         ADD CONSTRAINT doctor_practices_commission_sum_check
         CHECK (
           platform_commission_percent >= 0
           AND hospital_commission_percent >= 0
           AND doctor_commission_percent >= 0
           AND (platform_commission_percent + hospital_commission_percent + doctor_commission_percent) <= 100
         )`,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('doctor_practices', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_doctor_practices_status"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_doctor_practices_commission_mode"', { transaction });
    });
  }
};
