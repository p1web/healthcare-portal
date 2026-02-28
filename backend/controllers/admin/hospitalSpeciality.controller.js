const { HospitalSpecialty, Hospital, Specialty, sequelize } = require("../../models");

module.exports = {
  async getHospitalSpeciality(req, res) {
    try {
      const { hospitalId } = req.query;

      const where = {};
      if (hospitalId) {
        where.hospital_id = hospitalId;
      }

      const hospitalSpecialties = await HospitalSpecialty.findAll({
        where,
        attributes: [
          "hospital_id",
          [sequelize.fn("STRING_AGG", sequelize.col("Specialty.name"), ", "), "specialties"]
        ],
        include: [
          {
            model: Hospital,
            attributes: ["id", "name", "location", "address", "phone", "email"],
          },
          {
            model: Specialty,
            attributes: [],
          },
        ],
        group: ["Hospital.id", "HospitalSpecialty.hospital_id"],
        order: [["hospital_id", "DESC"]],
      });

      res.json(hospitalSpecialties);
    } catch (error) {
      console.error("Error fetching hospital specialities:", error);
      res.status(500).json({ error: "Failed to fetch hospital specialities" });
    }
  },

  async addHospitalSpeciality(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { hospital_id, specialty_id, is_primary } = req.body;

      if (!hospital_id || !specialty_id) {
        return res.status(400).json({
          message: "Hospital ID and Specialty ID are required"
        });
      }

      // Check if hospital exists
      const hospital = await Hospital.findByPk(hospital_id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      // Check if specialty exists
      const specialty = await Specialty.findByPk(specialty_id);
      if (!specialty) {
        return res.status(404).json({ message: "Specialty not found" });
      }

      // Prevent duplicate
      const existing = await HospitalSpecialty.findOne({
        where: { hospital_id, specialty_id }
      });

      if (existing) {
        return res.status(400).json({
          message: "Specialty already assigned to this hospital"
        });
      }

      const hospitalSpecialty = await HospitalSpecialty.create(
        {
          hospital_id,
          specialty_id,
          is_primary: is_primary || false
        },
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        message: "Specialty assigned to hospital successfully",
        data: hospitalSpecialty
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Error adding hospital specialty:", error);
      res.status(500).json({
        message: "Failed to assign specialty",
        error: error.message
      });
    }
  },

  async updateHospitalSpeciality(req, res) {
    try {
      const { hospital_id, specialty_id } = req.params;
      const { is_primary } = req.body;

      const hospitalSpecialty = await HospitalSpecialty.findOne({
        where: { hospital_id, specialty_id }
      });

      if (!hospitalSpecialty) {
        return res.status(404).json({
          message: "Hospital specialty not found"
        });
      }

      hospitalSpecialty.is_primary = is_primary ?? hospitalSpecialty.is_primary;

      await hospitalSpecialty.save();

      res.json({
        message: "Hospital specialty updated successfully",
        data: hospitalSpecialty
      });

    } catch (error) {
      console.error("Error updating hospital specialty:", error);
      res.status(500).json({
        message: "Failed to update hospital specialty",
        error: error.message
      });
    }
  },

  async deleteHospitalSpeciality(req, res) {
    try {
      const { id } = req.params;

      const hospitalSpecialty = await HospitalSpecialty.findOne({
        where: { id }
      });

      if (!hospitalSpecialty) {
        return res.status(404).json({
          message: "Hospital specialty not found"
        });
      }

      await hospitalSpecialty.destroy();

      res.json({
        message: "Specialty removed from hospital successfully"
      });

    } catch (error) {
      console.error("Error deleting hospital specialty:", error);
      res.status(500).json({
        message: "Failed to delete hospital specialty",
        error: error.message
      });
    }
  }

};
