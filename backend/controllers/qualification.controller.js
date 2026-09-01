'use strict';

const { Qualification } = require('../models');

class QualificationController {
  // GET /api/qualifications
  static async getAll(req, res) {
    try {
      const rows = await Qualification.findAll({
        attributes: ['id', 'name', 'description'],
        order: [['name', 'ASC']]
      });
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching qualifications:', error);
      return res.status(500).json({ message: 'Failed to fetch qualifications' });
    }
  }

  // GET /api/qualifications/:id
  static async getById(req, res) {
    try {
      const row = await Qualification.findByPk(req.params.id, {
        attributes: ['id', 'name', 'description']
      });
      if (!row) return res.status(404).json({ message: 'Qualification not found' });
      return res.status(200).json(row);
    } catch (error) {
      console.error('Error fetching qualification by id:', error);
      return res.status(500).json({ message: 'Failed to fetch qualification' });
    }
  }
}

module.exports = QualificationController;
