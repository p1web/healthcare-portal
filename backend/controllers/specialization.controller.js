'use strict';

const { Specialization } = require('../models');

class SpecializationController {

    // GET /api/specializations
    static async getAll(req, res) {
        
        try {
            const specializations = await Specialization.findAll({
                attributes: ['id', 'name', 'description','icon'],
                order: [['name', 'ASC']]
            });

            return res.status(200).json(specializations);
        } catch (error) {
            console.error('Error fetching specializations:', error);
            return res.status(500).json({
                message: 'Failed to fetch specializations'
            });
        }
    }

    // GET /api/specializations/:id
    static async getById(req, res) {
        try {
            const { id } = req.params;

            const specialization = await Specialization.findByPk(id, {
                attributes: ['id', 'name', 'description']
            });

            if (!specialization) {
                return res.status(404).json({
                    message: 'Specialization not found'
                });
            }

            return res.status(200).json(specialization);
        } catch (error) {
            console.error('Error fetching specialization by id:', error);
            return res.status(500).json({
                message: 'Failed to fetch specialization'
            });
        }
    }


}

module.exports = SpecializationController;
