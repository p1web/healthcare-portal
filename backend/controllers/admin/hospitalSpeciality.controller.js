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
          "created_at",
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
        group: ["Hospital.id", "HospitalSpecialty.hospital_id", "HospitalSpecialty.created_at"],
        order: [["hospital_id", "DESC"]],
      });

      res.json(hospitalSpecialties);
    } catch (error) {
      console.error("Error fetching hospital specialities:", error);
      res.status(500).json({ error: "Failed to fetch hospital specialities" });
    }
  },

  async getHospitalWiseSpecialityList(req, res) {
    try {
      const hospitalId = req.params.hospitalId || req.query.hospitalId;

      const where = {};
      if (hospitalId) {
        where.hospital_id = hospitalId;
      }

      const hospitalSpecialties = await HospitalSpecialty.findAll({
        where,
        attributes: ["hospital_id"],
        include: [
          { model: Specialty, attributes: ["id", "name"] },
        ]
      })

      res.json(hospitalSpecialties);

    } catch (error) {
      console.error("Error fetching hospital specialities:", error);
      res.status(500).json({ error: "Failed to fetch hospital specialities" });
    }
  },

  async updateHospitalSpeciality(req, res) {
    try {
      const { hospital_id } = req.params;   // hospitalId from path
      const { specialties } = req.body;   // array of specialty IDs

      // return res.status(200).json({ message: "Received update request", hospital_id, specialties });  
      if (!hospital_id || !Array.isArray(specialties)) {
        return res.status(400).json({ error: "hospital_id and specialties are required" });
      }

      // Step 1: Remove all existing specialties for this hospital
      await HospitalSpecialty.destroy({ where: { hospital_id: hospital_id } });

      // Step 2: Insert new mappings
      const newMappings = specialties.map(id => ({
        hospital_id: hospital_id,
        specialty_id: id
      }));

      await HospitalSpecialty.bulkCreate(newMappings);

      // Step 3: Fetch updated list with Specialty details
      const updatedSpecialties = await HospitalSpecialty.findAll({
        where: { hospital_id: hospital_id },
        include: [{ model: Specialty, attributes: ["id", "name"] }]
      });

      // Step 4: Respond with updated list
      res.json({
        hospital_id,
        specialties: updatedSpecialties.map(hs => hs.Specialty) // return clean list of specialties
      });

    } catch (error) {
      console.error("Error updating hospital specialties:", error);
      res.status(500).json({ error: "Failed to update hospital specialties" });
    }
  },

};
