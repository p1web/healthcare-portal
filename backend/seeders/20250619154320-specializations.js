'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // icon values must be valid Bootstrap Icons class names (bi-*) to render on the frontend
    const specializations = [
      { id: 1, name: 'Cardiology', description: 'Heart and cardiovascular system care', icon: 'bi-heart-pulse', created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'Neurology', description: 'Brain and nervous system disorders', icon: 'bi-activity', created_at: new Date(), updated_at: new Date() },
      { id: 3, name: 'Orthopedics', description: 'Bone, joint, and muscle treatments', icon: 'bi-person-standing', created_at: new Date(), updated_at: new Date() },
      { id: 4, name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents', icon: 'bi-emoji-smile', created_at: new Date(), updated_at: new Date() },
      { id: 5, name: 'General Medicine', description: 'General health care and primary medicine', icon: 'bi-clipboard2-pulse', created_at: new Date(), updated_at: new Date() },
      { id: 6, name: 'Dermatology', description: 'Skin, hair, and nail conditions', icon: 'bi-bandaid', created_at: new Date(), updated_at: new Date() },
      { id: 7, name: 'ENT', description: 'Ear, nose, and throat treatments', icon: 'bi-ear', created_at: new Date(), updated_at: new Date() },
      { id: 8, name: 'Cardiac Surgery', description: 'Surgical procedures on the heart', icon: 'bi-heart-pulse-fill', created_at: new Date(), updated_at: new Date() },
      { id: 9, name: 'Interventional Cardiology', description: 'Minimally invasive cardiac procedures', icon: 'bi-heart-arrow', created_at: new Date(), updated_at: new Date() },
      { id: 10, name: 'Neurosurgery', description: 'Surgical treatment of brain and nervous system', icon: 'bi-clipboard-pulse', created_at: new Date(), updated_at: new Date() },
      { id: 11, name: 'Psychiatry', description: 'Mental health and psychological disorders', icon: 'bi-moon-stars', created_at: new Date(), updated_at: new Date() },
      { id: 12, name: 'Gynecology', description: "Women's reproductive health", icon: 'bi-gender-female', created_at: new Date(), updated_at: new Date() },
      { id: 13, name: 'Obstetrics', description: 'Pregnancy and childbirth care', icon: 'bi-person-standing-dress', created_at: new Date(), updated_at: new Date() },
      { id: 14, name: 'Neonatology', description: 'Medical care for newborn infants', icon: 'bi-shield-plus', created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('specializations', specializations, { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('specializations', null, {});
  }
};
