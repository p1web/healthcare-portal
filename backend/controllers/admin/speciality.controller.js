const {
    Specialty
} = require("../../models");

const { Op } = require("sequelize");

module.exports = {

    async getSpecialities(req, res) {
        try {
            const specialities = await Specialty.findAll({
                order: [["id", "DESC"]],
                attributes: ["id", "name", "description", "icon", "created_at"]
            });
            res.json(specialities);
        } catch (error) {
            console.error("Error fetching specialities:", error);
            res.status(500).json({ error: "Failed to fetch specialities" });
        }
    }

};
