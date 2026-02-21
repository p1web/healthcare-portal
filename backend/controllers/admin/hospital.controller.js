const {
  HospitalProfile,
  User,
  Hospital,
  Accreditation,
  Facility,
  Specialty,    
  HospitalImage
} = require("../../models");

const { Op } = require("sequelize");

module.exports = {

  // ===============================
  //  All Hospital Profiles (Admin)
  // ===============================
  async getHospitalUserProfiles(req, res) {
    try {
      const { status = "ALL" } = req.query;

      const userWhere = { role: "hospital" };
      const profileWhere = {};

      switch (status) {

        case "ACTIVE":
          userWhere.is_active = true;
          userWhere.is_blocked = false;
          profileWhere.is_verified = true;
          break;

        case "BLOCKED":
          userWhere[Op.or] = [
            { is_active: false },
            { is_blocked: true }
          ];
          break;

        case "VERIFIED":
          profileWhere.is_verified = true;
          userWhere.is_blocked = false; // optional, keeps list clean
          break;

        default:
          // ALL → no extra filters
          break;
      }

      const users = await User.findAll({ 
            where: userWhere, 
            include: [ { 
                model: HospitalProfile, as: "hospitalProfile", 
                where: profileWhere 
            }] 
        });

      res.json(users);

    } catch (error) {
      console.error(error.stack);
      res.status(500).json({
        message: "Failed to load hospital user profiles",
        error: error.message
      });
    }
  },


  // ==================================
  // Public Hospital Listings
  // ==================================
    async getPublicHospitals(req, res) {
        try {
            const hospitals = await Hospital.findAll({
                include: [
                    {
                        model: Accreditation,
                        as: "accreditations",
                        through: {
                            attributes: [
                                "certified_date",
                                "expiry_date",
                                "certificate_number"
                            ]
                        },
                        required: false
                    },
                    {
                        model: Specialty,
                        as: "specialties",
                        through: {
                            attributes: ["is_primary"] // from hospital_specialties table
                        },
                        required: false
                    },
                    {
                        model: Facility,
                        as: "facilities",
                        through: {
                            attributes: [] // no extra fields in hospital_facilities
                        },
                        required: false
                    },
                    {
                        model: HospitalImage,
                        as: "images",
                        required: false
                    }
                ],
                order: [["id", "DESC"]]
            });

            res.json(hospitals);

        } catch (error) {
            console.error("get public hospital error:", error);
            res.status(500).json({
                message: "Failed to load public hospital",
                error: error.message
            });
        }
    }


};
