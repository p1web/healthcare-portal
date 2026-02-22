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
};
