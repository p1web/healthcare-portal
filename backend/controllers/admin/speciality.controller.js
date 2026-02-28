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
    },

    //  Add new speciality
    async addSpeciality(req, res) {
        try {
            const { specialty_name, specialty_icon, specialty_description } = req.body;

            // Basic validation
            if (!specialty_name || specialty_name.trim() === "") {
                return res.status(400).json({
                    message: "Speciality name is required"
                });
            }

            // Check duplicate (case-insensitive)
            const existing = await Specialty.findOne({
                where: {
                    name: {
                        [Op.iLike]: specialty_name.trim()
                    }
                }
            });

            if (existing) {
                return res.status(400).json({
                    message: "Speciality already exists"
                });
            }

            // Create record
            const speciality = await Specialty.create({
                name: specialty_name.trim(),                
                icon: specialty_icon || null,
                description: specialty_description || null
            });

            res.status(201).json({
                message: "Speciality added successfully",
                data: speciality
            });

        } catch (error) {
            console.error("Error adding speciality:", error);
            res.status(500).json({
                message: "Failed to add speciality",
                error: error.message
            });
        }
    },

    async updateSpeciality(req, res) {
        try {
            const { id } = req.params;
            const { specialty_name, specialty_icon, specialty_description } = req.body;

            // Check if record exists
            const speciality = await Specialty.findByPk(id);

            if (!speciality) {
                return res.status(404).json({
                    message: "Speciality not found"
                });
            }

            // Validate name
            if (!specialty_name || specialty_name.trim() === "") {
                return res.status(400).json({
                    message: "Speciality name is required"
                });
            }

            // 🔹 Duplicate check (excluding current record)
            const existing = await Specialty.findOne({
                where: {
                    name: specialty_name.trim(),
                    id: { [Op.ne]: id }
                }
            });

            if (existing) {
                return res.status(400).json({
                    message: "Another speciality with this name already exists"
                });
            }

            // Update fields
            speciality.name = specialty_name.trim();
            speciality.description = specialty_description || null;
            speciality.icon = specialty_icon || null;

            await speciality.save();

            res.json({
                message: "Speciality updated successfully",
                data: speciality
            });

        } catch (error) {
            console.error("Error updating speciality:", error);
            res.status(500).json({
                message: "Failed to update speciality",
                error: error.message
            });
        }
    },

    // DELETE SPECIALTY
    async deleteSpeciality(req, res) {
        try {
            const { id } = req.params;

            const speciality = await Specialty.findByPk(id);

            if (!speciality) {
                return res.status(404).json({
                    message: "Speciality not found"
                });
            }

            await speciality.destroy();

            res.json({
                message: "Speciality deleted successfully"
            });

        } catch (error) {
            console.error("Error deleting speciality:", error);
            res.status(500).json({
                message: "Failed to delete speciality",
                error: error.message
            });
        }
    }


};
