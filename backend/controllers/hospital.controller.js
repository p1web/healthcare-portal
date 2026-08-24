const { Specialty, Facility } = require('../models');
const { findPublicHospitalProfiles, formatPublicHospital } = require('../utils/publicHospital');

module.exports = {
  async getHospitalist(req, res) {
    try {
      const entries = await findPublicHospitalProfiles();
      res.status(200).json(entries.map(({ profile }) => ({ id: profile.id, name: profile.hospitalName })));
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      res.status(500).json({ message: 'Failed to fetch hospitals' });
    }
  },

  async getAll(req, res) {
    try {
      let hospitals = (await findPublicHospitalProfiles()).map(formatPublicHospital);
      const search = String(req.query.search || '').trim().toLowerCase();
      const specialty = String(req.query.specialty || 'all').toLowerCase();
      const rating = Number(req.query.rating || 0);

      if (search) {
        hospitals = hospitals.filter(hospital => [
          hospital.name,
          hospital.location,
          hospital.address,
          ...hospital.specialties
        ].some(value => String(value || '').toLowerCase().includes(search)));
      }
      if (specialty !== 'all') {
        hospitals = hospitals.filter(hospital => hospital.specialties.some(name => name.toLowerCase() === specialty));
      }
      if (rating > 0) {
        hospitals = hospitals.filter(hospital => hospital.rating >= rating);
      }
      if (req.query.emergency === 'true') {
        hospitals = hospitals.filter(hospital => hospital.emergencyAvailable);
      }

      const sortBy = String(req.query.sortBy || 'rating');
      hospitals.sort((left, right) => {
        if (sortBy === 'name') return left.name.localeCompare(right.name);
        if (sortBy === 'discount') return parseInt(right.discount, 10) - parseInt(left.discount, 10);
        return right.rating - left.rating;
      });

      res.json({ success: true, count: hospitals.length, data: hospitals });
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      res.status(500).json({ success: false, message: 'Error fetching hospitals', error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const [entry] = await findPublicHospitalProfiles({ id: req.params.id });
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Hospital not found or not publicly available' });
      }
      return res.json({ success: true, data: formatPublicHospital(entry) });
    } catch (error) {
      console.error('Error fetching hospital by ID:', error);
      return res.status(500).json({ success: false, message: 'Error fetching hospital', error: error.message });
    }
  },

  async getSpecialties(req, res) {
    try {
      const list = await Specialty.findAll({ order: [['name', 'ASC']] });
      res.json({ success: true, data: list });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getFacilities(req, res) {
    try {
      const list = await Facility.findAll({ order: [['name', 'ASC']] });
      res.json({ success: true, data: list });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
