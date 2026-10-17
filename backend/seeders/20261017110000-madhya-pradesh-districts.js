'use strict';

const stateName = 'Madhya Pradesh';
const districtNames = [
  'Agarmalwa',
  'Alirajpur',
  'Anuppur',
  'Ashoknagar',
  'Indore',
  'Ujjain',
  'Umaria',
  'Katni',
  'Khandwa',
  'Khargone',
  'Guna',
  'Gwalior',
  'Chhatarpur',
  'Chhindwara',
  'Jabalpur',
  'Jhabua',
  'Tikamgarh',
  'Datia',
  'Damoh',
  'Dewas',
  'Dhar',
  'Dindori',
  'Narsinghpur',
  'Neemuch',
  'Panna',
  'Barwani',
  'Balaghat',
  'Betul',
  'Burhanpur',
  'Bhind',
  'Bhopal',
  'Mandla',
  'Mandsaur',
  'Morena',
  'Ratlam',
  'Rewa',
  'Rajgarh',
  'Raisen',
  'Vidisha',
  'Shahdol',
  'Shajapur',
  'Shivpuri',
  'Sheopur',
  'Satna',
  'Sagar',
  'Seoni',
  'Sidhi',
  'Sehore',
  'Singrauli',
  'Harda',
  'Narmadapuram',
  'Niwari',
  'Mauganj',
  'Maihar',
  'Pandhurna'
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let [states] = await queryInterface.sequelize.query(
        'SELECT id FROM states WHERE name = :stateName LIMIT 1',
        { replacements: { stateName }, transaction }
      );

      if (!states.length) {
        await queryInterface.bulkInsert('states', [{
          name: stateName,
          created_at: new Date(),
          updated_at: new Date()
        }], { transaction });
        [states] = await queryInterface.sequelize.query(
          'SELECT id FROM states WHERE name = :stateName LIMIT 1',
          { replacements: { stateName }, transaction }
        );
      }

      const stateId = states[0].id;
      const [existingDistricts] = await queryInterface.sequelize.query(
        'SELECT name FROM districts WHERE state_id = :stateId',
        { replacements: { stateId }, transaction }
      );
      const existingNames = new Set(existingDistricts.map((district) => district.name));
      const now = new Date();
      const rowsToInsert = districtNames
        .filter((name) => !existingNames.has(name))
        .map((name) => ({
          state_id: stateId,
          name,
          created_at: now,
          updated_at: now
        }));

      if (rowsToInsert.length) {
        await queryInterface.bulkInsert('districts', rowsToInsert, { transaction });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [states] = await queryInterface.sequelize.query(
        'SELECT id FROM states WHERE name = :stateName LIMIT 1',
        { replacements: { stateName }, transaction }
      );
      if (!states.length) return;

      const stateId = states[0].id;
      await queryInterface.bulkDelete('districts', {
        state_id: stateId,
        name: districtNames
      }, { transaction });

      const [remainingDistricts] = await queryInterface.sequelize.query(
        'SELECT id FROM districts WHERE state_id = :stateId LIMIT 1',
        { replacements: { stateId }, transaction }
      );
      if (!remainingDistricts.length) {
        await queryInterface.bulkDelete('states', { id: stateId }, { transaction });
      }
    });
  }
};