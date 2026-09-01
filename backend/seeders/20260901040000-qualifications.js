'use strict';

const commonDegrees = [
  ['MBBS', 'Bachelor of Medicine, Bachelor of Surgery'],
  ['MD', 'Doctor of Medicine (post-graduate)'],
  ['MS', 'Master of Surgery (post-graduate)'],
  ['DM', 'Doctorate of Medicine (super-speciality)'],
  ['MCh', 'Magister Chirurgiae (super-speciality surgical)'],
  ['DNB', 'Diplomate of National Board'],
  ['DGO', 'Diploma in Gynaecology and Obstetrics'],
  ['DCH', 'Diploma in Child Health'],
  ['DA', 'Diploma in Anaesthesiology'],
  ['DLO', 'Diploma in Oto-rhino-laryngology'],
  ['DO', 'Diploma in Ophthalmology'],
  ['DPM', 'Diploma in Psychological Medicine'],
  ['DDVL', 'Diploma in Dermatology, Venereology and Leprosy'],
  ['DOMS', 'Diploma in Ophthalmic Medicine and Surgery'],
  ['BDS', 'Bachelor of Dental Surgery'],
  ['MDS', 'Master of Dental Surgery'],
  ['BAMS', 'Bachelor of Ayurvedic Medicine and Surgery'],
  ['BHMS', 'Bachelor of Homeopathic Medicine and Surgery'],
  ['BUMS', 'Bachelor of Unani Medicine and Surgery'],
  ['BSMS', 'Bachelor of Siddha Medicine and Surgery'],
  ['BPT', 'Bachelor of Physiotherapy'],
  ['MPT', 'Master of Physiotherapy'],
  ['MPH', 'Master of Public Health'],
  ['PhD', 'Doctor of Philosophy'],
  ['Fellowship', 'Post-doctoral clinical fellowship']
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('qualifications', commonDegrees.map(([name, description]) => ({
      name,
      description,
      created_at: now,
      updated_at: now
    })));
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('qualifications', {
      name: { [Sequelize.Op.in]: commonDegrees.map(([name]) => name) }
    });
  }
};
