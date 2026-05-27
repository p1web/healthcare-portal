const {
    Specialization
} = require("../../models");

const { Op } = require("sequelize");

module.exports = {
    async getSpecializations(req, res) {
        try {
            const specializations = await Specialization.findAll({
                order: [["id", "DESC"]],
                attributes: ['id', 'name', 'icon', 'description', 'created_at']
            });
            res.json(specializations);
        } catch (error) {
            console.error("Error fetching specializations:", error);
            res.status(500).json({ error: "Failed to fetch specializations" });
        }
    },
    //  Add New
    async addSpecialization(req, res) {
        try {
            const { specialization_name, specialization_icon, specialization_description } = req.body;

            if (!specialization_name || specialization_name.trim() === "") {
                return res.status(400).json({
                    message: "Specialization name is required"
                });
            }

            // Duplicate check
            const existing = await Specialization.findOne({
                where: {
                    name: specialization_name.trim()
                }
            });

            if (existing) {
                return res.status(400).json({
                    message: "Specialization already exists"
                });
            }

            const specialization = await Specialization.create({
                name: specialization_name.trim(),
                icon: specialization_icon || null,
                description: specialization_description || null
            });

            res.status(201).json({
                message: "Specialization added successfully",
                data: specialization
            });

        } catch (error) {
            console.error("Error adding specialization:", error);
            res.status(500).json({
                message: "Failed to add specialization",
                error: error.message
            });
        }
    },

    //  Update
    async updateSpecialization(req, res) {
        try {
            const { id } = req.params;
            const { specialization_name, specialization_icon, specialization_description } = req.body;

            const specialization = await Specialization.findByPk(id);

            if (!specialization) {
                return res.status(404).json({
                    message: "Specialization not found"
                });
            }

            if (!specialization_name || specialization_name.trim() === "") {
                return res.status(400).json({
                    message: "Specialization name is required"
                });
            }

            // Duplicate check excluding current record
            const existing = await Specialization.findOne({
                where: {
                    name: specialization_name.trim(),
                    id: { [Op.ne]: id }
                }
            });

            if (existing) {
                return res.status(400).json({
                    message: "Another specialization with this name already exists"
                });
            }

            specialization.name = specialization_name.trim();
            specialization.icon = specialization_icon || null;
            specialization.description = specialization_description || null;

            await specialization.save();

            res.json({
                message: "Specialization updated successfully",
                data: specialization
            });

        } catch (error) {
            console.error("Error updating specialization:", error);
            res.status(500).json({
                message: "Failed to update specialization",
                error: error.message
            });
        }
    },

    // DELETE SPECIALIZATION
    async deleteSpecialization(req, res) {
        try {
            const { id } = req.params;

            const specialization = await Specialization.findByPk(id);

            if (!specialization) {
                return res.status(404).json({
                    message: "Specialization not found"
                });
            }

            await specialization.destroy();

            res.json({
                message: "Specialization deleted successfully"
            });

        } catch (error) {
            console.error("Error deleting specialization:", error);
            res.status(500).json({
                message: "Failed to delete specialization",
                error: error.message
            });
        }
    }
};