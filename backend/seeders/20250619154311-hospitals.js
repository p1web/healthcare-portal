'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('hospitals', [
      {
        id: 1,
        name: 'City General Hospital',
        location: 'Downtown, Mumbai',
        address: '123 Main Street, Downtown, Mumbai - 400001',
        phone: '+91 98765 43210',
        email: 'contact@citygeneral.com',
        rating: 4.5,
        discount: '20%',
        description: 'A leading multi-specialty hospital with state-of-the-art facilities and experienced medical professionals.',
        beds: 250,
        established: 1985,
        operating_hours: '24/7',
        emergency_available: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'MediCare Plus',
        location: 'Andheri, Mumbai',
        address: '456 West Road, Andheri, Mumbai - 400053',
        phone: '+91 98765 43211',
        email: 'info@medicareplus.com',
        rating: 4.7,
        discount: '30%',
        description: 'Premier healthcare facility specializing in orthopedics and pediatric care with modern infrastructure.',
        beds: 180,
        established: 1998,
        operating_hours: '24/7',
        emergency_available: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        name: 'HealthFirst Clinic',
        location: 'Bandra, Mumbai',
        address: '789 Linking Road, Bandra, Mumbai - 400050',
        phone: '+91 98765 43212',
        email: 'support@healthfirst.com',
        rating: 4.3,
        discount: '25%',
        description: 'Comprehensive outpatient care center focused on preventive health and wellness programs.',
        beds: 50,
        established: 2005,
        operating_hours: '8:00 AM - 10:00 PM',
        emergency_available: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        name: 'Apollo Heart Center',
        location: 'Powai, Mumbai',
        address: '321 Lake View, Powai, Mumbai - 400076',
        phone: '+91 98765 43213',
        email: 'info@apolloheart.com',
        rating: 4.9,
        discount: '15%',
        description: 'Specialized cardiac care center with world-class cardiologists and advanced cardiac technology.',
        beds: 120,
        established: 2010,
        operating_hours: '24/7',
        emergency_available: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        name: 'Neuro Care Hospital',
        location: 'Borivali, Mumbai',
        address: '654 National Park Road, Borivali, Mumbai - 400066',
        phone: '+91 98765 43214',
        email: 'contact@neurocare.com',
        rating: 4.6,
        discount: '20%',
        description: 'Leading neurological care facility with expert neurologists and advanced neuro-imaging.',
        beds: 100,
        established: 2012,
        operating_hours: '24/7',
        emergency_available: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 6,
        name: 'Women & Child Hospital',
        location: 'Chembur, Mumbai',
        address: '987 Eastern Express Highway, Chembur, Mumbai - 400071',
        phone: '+91 98765 43215',
        email: 'info@womenandchild.com',
        rating: 4.4,
        discount: '25%',
        description: "Dedicated to women's health and pediatric care with compassionate and expert medical team.",
        beds: 150,
        established: 2008,
        operating_hours: '24/7',
        emergency_available: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('hospitals', null, {});
  }
};
