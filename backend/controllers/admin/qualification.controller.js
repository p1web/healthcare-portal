'use strict';

const { Qualification } = require('../../models');
const { Op } = require('sequelize');

module.exports = {
  async getQualifications(req, res) {
    try {
      const rows = await Qualification.findAll({
        order: [['id', 'DESC']],
        attributes: ['id', 'name', 'description', 'created_at']
      });
      res.json(rows);
    } catch (error) {
      console.error('Error fetching qualifications:', error);
      res.status(500).json({ error: 'Failed to fetch qualifications' });
    }
  },

  async addQualification(req, res) {
    try {
      const { qualification_name, qualification_description } = req.body;

      if (!qualification_name || qualification_name.trim() === '') {
        return res.status(400).json({ message: 'Qualification name is required' });
      }

      const existing = await Qualification.findOne({ where: { name: qualification_name.trim() } });
      if (existing) {
        return res.status(400).json({ message: 'Qualification already exists' });
      }

      const row = await Qualification.create({
        name: qualification_name.trim(),
        description: qualification_description || null
      });

      res.status(201).json({ message: 'Qualification added successfully', data: row });
    } catch (error) {
      console.error('Error adding qualification:', error);
      res.status(500).json({ message: 'Failed to add qualification', error: error.message });
    }
  },

  async updateQualification(req, res) {
    try {
      const { id } = req.params;
      const { qualification_name, qualification_description } = req.body;

      const row = await Qualification.findByPk(id);
      if (!row) return res.status(404).json({ message: 'Qualification not found' });

      if (!qualification_name || qualification_name.trim() === '') {
        return res.status(400).json({ message: 'Qualification name is required' });
      }

      const existing = await Qualification.findOne({
        where: { name: qualification_name.trim(), id: { [Op.ne]: id } }
      });
      if (existing) {
        return res.status(400).json({ message: 'Another qualification with this name already exists' });
      }

      row.name = qualification_name.trim();
      row.description = qualification_description || null;
      await row.save();

      res.json({ message: 'Qualification updated successfully', data: row });
    } catch (error) {
      console.error('Error updating qualification:', error);
      res.status(500).json({ message: 'Failed to update qualification', error: error.message });
    }
  },

  async deleteQualification(req, res) {
    try {
      const { id } = req.params;
      const row = await Qualification.findByPk(id);
      if (!row) return res.status(404).json({ message: 'Qualification not found' });

      await row.destroy();
      res.json({ message: 'Qualification deleted successfully' });
    } catch (error) {
      console.error('Error deleting qualification:', error);
      res.status(500).json({ message: 'Failed to delete qualification', error: error.message });
    }
  }
};
