'use strict';

// One-time backfill: copies legacy JSON allergies/medical_conditions arrays
// from patient_profiles into the new history-tracked tables.
module.exports = {
  async up(queryInterface, Sequelize) {
    const profiles = await queryInterface.sequelize.query(
      'SELECT id, allergies, medical_conditions FROM patient_profiles',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const now = new Date();
    const allergyRows = [];
    const conditionRows = [];

    const toArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    for (const profile of profiles) {
      toArray(profile.allergies).forEach((name) => {
        if (!name) return;
        allergyRows.push({
          patient_profile_id: profile.id,
          name,
          status: 'active',
          created_at: now,
          updated_at: now
        });
      });

      toArray(profile.medical_conditions).forEach((name) => {
        if (!name) return;
        conditionRows.push({
          patient_profile_id: profile.id,
          name,
          status: 'active',
          created_at: now,
          updated_at: now
        });
      });
    }

    if (allergyRows.length) {
      await queryInterface.bulkInsert('patient_allergies', allergyRows);
    }
    if (conditionRows.length) {
      await queryInterface.bulkInsert('patient_medical_conditions', conditionRows);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('patient_allergies', null, {});
    await queryInterface.bulkDelete('patient_medical_conditions', null, {});
  }
};
