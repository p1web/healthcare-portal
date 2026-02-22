const {
 Specialization
} = require("../../models");

const { Op } = require("sequelize");

module.exports = {
    async getSpecializations(req, res) {
        try {
            const specializations = await Specialization.findAll({
                order: [["id", "DESC"]],
                attributes: ['id', 'name', 'description', 'created_at']
            });
            res.json(specializations);
        } catch (error) {
            console.error("Error fetching specializations:", error);
            res.status(500).json({ error: "Failed to fetch specializations" });
        }
    } 
};
