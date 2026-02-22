const {
 Specialization,
 DoctorSpecialization,
} = require("../../models");

const { Op } = require("sequelize");

module.exports = {
    async getDoctorSpecialization(req, res) {
        try {
            
        } catch (error) {
            console.error("Error fetching doctor specializations:", error);
            res.status(500).json({ error: "Failed to fetch doctor specializations" });
        }
    } 
};
