'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const specializations = [
      { id: 1, name: 'Cardiology', description: 'Heart and cardiovascular system care', icon: 'heart', created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'Neurology', description: 'Brain and nervous system disorders', icon: 'brain', created_at: new Date(), updated_at: new Date() },
      { id: 3, name: 'Orthopedics', description: 'Bone, joint, and muscle treatments', icon: 'bone', created_at: new Date(), updated_at: new Date() },
      { id: 4, name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents', icon: 'baby', created_at: new Date(), updated_at: new Date() },
      { id: 5, name: 'General Medicine', description: 'General health care and primary medicine', icon: 'stethoscope', created_at: new Date(), updated_at: new Date() },
      { id: 6, name: 'Dermatology', description: 'Skin, hair, and nail conditions', icon: 'allergies', created_at: new Date(), updated_at: new Date() },
      { id: 7, name: 'ENT', description: 'Ear, nose, and throat treatments', icon: 'head-side-cough', created_at: new Date(), updated_at: new Date() },
      { id: 8, name: 'Cardiac Surgery', description: 'Surgical procedures on the heart', icon: 'heart-pulse', created_at: new Date(), updated_at: new Date() },
      { id: 9, name: 'Interventional Cardiology', description: 'Minimally invasive cardiac procedures', icon: 'heart-circle-check', created_at: new Date(), updated_at: new Date() },
      { id: 10, name: 'Neurosurgery', description: 'Surgical treatment of brain and nervous system', icon: 'user-nurse', created_at: new Date(), updated_at: new Date() },
      { id: 11, name: 'Psychiatry', description: 'Mental health and psychological disorders', icon: 'brain', created_at: new Date(), updated_at: new Date() },
      { id: 12, name: 'Gynecology', description: "Women's reproductive health", icon: 'person-dress', created_at: new Date(), updated_at: new Date() },
      { id: 13, name: 'Obstetrics', description: 'Pregnancy and childbirth care', icon: 'baby-carriage', created_at: new Date(), updated_at: new Date() },
      { id: 14, name: 'Neonatology', description: 'Medical care for newborn infants', icon: 'baby', created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('specializations', specializations, { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('specializations', null, {});
  }
};
