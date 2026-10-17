'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        INSERT INTO states (name, created_at, updated_at)
        SELECT DISTINCT ON (LOWER(BTRIM(location.state_name)))
          BTRIM(location.state_name), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM (
          SELECT state AS state_name FROM users
          UNION ALL
          SELECT hospital_state AS state_name FROM hospital_profiles
        ) AS location
        WHERE NULLIF(BTRIM(location.state_name), '') IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM states existing
            WHERE LOWER(BTRIM(existing.name)) = LOWER(BTRIM(location.state_name))
          )
        ORDER BY LOWER(BTRIM(location.state_name)), BTRIM(location.state_name)
      `, { transaction });

      await queryInterface.sequelize.query(`
        INSERT INTO districts (state_id, name, created_at, updated_at)
        SELECT state.id, MIN(CASE
          WHEN LOWER(BTRIM(location.state_name)) = 'madhya pradesh'
            AND LOWER(BTRIM(location.district_name)) = 'bhoapl' THEN 'Bhopal'
          ELSE BTRIM(location.district_name)
        END), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM (
          SELECT state AS state_name, city AS district_name FROM users
          UNION ALL
          SELECT hospital_state AS state_name, hospital_city AS district_name FROM hospital_profiles
        ) AS location
        JOIN states state
          ON LOWER(BTRIM(state.name)) = LOWER(BTRIM(location.state_name))
        WHERE NULLIF(BTRIM(location.district_name), '') IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM districts existing
            WHERE existing.state_id = state.id
              AND LOWER(BTRIM(existing.name)) = LOWER(BTRIM(CASE
                WHEN LOWER(BTRIM(location.state_name)) = 'madhya pradesh'
                  AND LOWER(BTRIM(location.district_name)) = 'bhoapl' THEN 'Bhopal'
                ELSE location.district_name
              END))
          )
        GROUP BY state.id, LOWER(BTRIM(CASE
          WHEN LOWER(BTRIM(location.state_name)) = 'madhya pradesh'
            AND LOWER(BTRIM(location.district_name)) = 'bhoapl' THEN 'Bhopal'
          ELSE location.district_name
        END))
      `, { transaction });

      await queryInterface.addColumn('users', 'state_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'states', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });
      await queryInterface.addColumn('users', 'district_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'districts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });
      await queryInterface.addColumn('hospital_profiles', 'hospital_state_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'states', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });
      await queryInterface.addColumn('hospital_profiles', 'hospital_district_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'districts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE users user_row
        SET state_id = state.id
        FROM states state
        WHERE LOWER(BTRIM(user_row.state)) = LOWER(BTRIM(state.name))
      `, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE users user_row
        SET district_id = district.id
        FROM districts district
        WHERE district.state_id = user_row.state_id
          AND LOWER(BTRIM(CASE
            WHEN user_row.state_id = (SELECT id FROM states WHERE LOWER(name) = 'madhya pradesh')
              AND LOWER(BTRIM(user_row.city)) = 'bhoapl' THEN 'Bhopal'
            ELSE user_row.city
          END)) = LOWER(BTRIM(district.name))
      `, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE hospital_profiles profile
        SET hospital_state_id = state.id
        FROM states state
        WHERE LOWER(BTRIM(profile.hospital_state)) = LOWER(BTRIM(state.name))
      `, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE hospital_profiles profile
        SET hospital_district_id = district.id
        FROM districts district
        WHERE district.state_id = profile.hospital_state_id
          AND LOWER(BTRIM(CASE
            WHEN profile.hospital_state_id = (SELECT id FROM states WHERE LOWER(name) = 'madhya pradesh')
              AND LOWER(BTRIM(profile.hospital_city)) = 'bhoapl' THEN 'Bhopal'
            ELSE profile.hospital_city
          END)) = LOWER(BTRIM(district.name))
      `, { transaction });

      const [unmappedLocations] = await queryInterface.sequelize.query(`
        SELECT
          (SELECT COUNT(*) FROM users
            WHERE (NULLIF(BTRIM(state), '') IS NOT NULL AND state_id IS NULL)
               OR (NULLIF(BTRIM(city), '') IS NOT NULL AND district_id IS NULL)) AS users,
          (SELECT COUNT(*) FROM hospital_profiles
            WHERE (NULLIF(BTRIM(hospital_state), '') IS NOT NULL AND hospital_state_id IS NULL)
               OR (NULLIF(BTRIM(hospital_city), '') IS NOT NULL AND hospital_district_id IS NULL)) AS hospitals
      `, { transaction });

      if (Number(unmappedLocations[0].users) || Number(unmappedLocations[0].hospitals)) {
        throw new Error('Cannot normalize profile locations: some legacy values do not match a state and district master record');
      }

      await queryInterface.addIndex('users', ['state_id'], { name: 'users_state_id_idx', transaction });
      await queryInterface.addIndex('users', ['district_id'], { name: 'users_district_id_idx', transaction });
      await queryInterface.addIndex('hospital_profiles', ['hospital_state_id'], { name: 'hospital_profiles_state_id_idx', transaction });
      await queryInterface.addIndex('hospital_profiles', ['hospital_district_id'], { name: 'hospital_profiles_district_id_idx', transaction });

      await queryInterface.removeColumn('users', 'state', { transaction });
      await queryInterface.removeColumn('users', 'city', { transaction });
      await queryInterface.removeColumn('hospital_profiles', 'hospital_state', { transaction });
      await queryInterface.removeColumn('hospital_profiles', 'hospital_city', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('users', 'state', { type: Sequelize.STRING(100), allowNull: true }, { transaction });
      await queryInterface.addColumn('users', 'city', { type: Sequelize.STRING(100), allowNull: true }, { transaction });
      await queryInterface.addColumn('hospital_profiles', 'hospital_state', { type: Sequelize.STRING(100), allowNull: true }, { transaction });
      await queryInterface.addColumn('hospital_profiles', 'hospital_city', { type: Sequelize.STRING(100), allowNull: true }, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE users user_row
        SET state = state.name
        FROM states state
        WHERE user_row.state_id = state.id
      `, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE users user_row
        SET city = district.name
        FROM districts district
        WHERE user_row.district_id = district.id
      `, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE hospital_profiles profile
        SET hospital_state = state.name
        FROM states state
        WHERE profile.hospital_state_id = state.id
      `, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE hospital_profiles profile
        SET hospital_city = district.name
        FROM districts district
        WHERE profile.hospital_district_id = district.id
      `, { transaction });

      await queryInterface.removeIndex('users', 'users_state_id_idx', { transaction });
      await queryInterface.removeIndex('users', 'users_district_id_idx', { transaction });
      await queryInterface.removeIndex('hospital_profiles', 'hospital_profiles_state_id_idx', { transaction });
      await queryInterface.removeIndex('hospital_profiles', 'hospital_profiles_district_id_idx', { transaction });
      await queryInterface.removeColumn('users', 'state_id', { transaction });
      await queryInterface.removeColumn('users', 'district_id', { transaction });
      await queryInterface.removeColumn('hospital_profiles', 'hospital_state_id', { transaction });
      await queryInterface.removeColumn('hospital_profiles', 'hospital_district_id', { transaction });
    });
  }
};