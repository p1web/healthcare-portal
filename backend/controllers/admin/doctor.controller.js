const {
  DoctorProfile,
  Doctor,
  User,
  Specialization,
  Hospital,
} = require("../../models");

const { Op } = require("sequelize");

module.exports = {

  // ===============================
  //  All Doctor Profiles (Admin)
  // ===============================
  async getDoctorProfiles(req, res) {
    try {
      const { status = "ALL" } = req.query;

      const userWhere = { role: "doctor" };
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

      const doctors = await DoctorProfile.findAll({
        where: profileWhere,
        include: [
          {
            model: User,
            as: "user",
            where: userWhere,
            attributes: [
              "id", "name", "email", "phone",
              "gender", "address", "city",
              "state", "country", "pincode",
              "is_active", "is_blocked",
              "created_at", "updated_at"
            ]
          },
          // {
          //   model: Doctor,
          //   as: "doctor",
          //   include: [
          //     {
          //       model: Specialization,
          //       as: "specialization"
          //     }
          //   ]
          // }
        ],
        order: [["created_at", "DESC"]],
        // logging: console.log
      });

      res.json(doctors);

    } catch (error) {
      console.error(error.stack);
      res.status(500).json({
        message: "Failed to load doctor profiles",
        error: error.message
      });
    }
  },


  // ==================================
  // Pending Doctor Approvals
  // ==================================
  async getPendingDoctors(req, res) {
    try {
      const doctors = await DoctorProfile.findAll({
        where: {
          verification_status: "PENDING"
        },
        include: [
          { model: User, attributes: ["id", "name", "email"] },
          { model: Doctor }
        ]
      });

      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to load pending doctors", error });
    }
  },

  // ============================
  // Verified Doctors
  // ============================
  async getVerifiedDoctors(req, res) {
    try {
      const doctors = await DoctorProfile.findAll({
        where: {
          verification_status: "VERIFIED",
          is_active: true,
          is_blocked: false
        },
        include: [
          { model: User, attributes: ["id", "name", "email"] },
          { model: Doctor }
        ]
      });

      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to load verified doctors", error });
    }
  },

  // ==================================
  // Rejected / Inactive Doctors
  // ==================================
  async getRejectedOrInactiveDoctors(req, res) {
    try {
      const doctors = await DoctorProfile.findAll({
        where: {
          [Op.or]: [
            { verification_status: "REJECTED" },
            { is_active: false },
            { is_blocked: true }
          ]
        },
        include: [
          { model: User, attributes: ["id", "name", "email"] },
          { model: Doctor }
        ]
      });

      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to load inactive doctors", error });
    }
  },

  // ==================================
  // Public Doctor Listings
  // ==================================
  async getPublicDoctors(req, res) {
    try {
      const doctors = await Doctor.findAll({
        // where: {
        //   is_published: true
        // },
        include: [
          {
            model: DoctorProfile,
            as: 'profile',
            required: true, // INNER JOIN
            where: {
              is_verified: true
            },
            include: [
              {
                model: User,
                as: 'user',
                required: true,
                where: {
                  is_active: true,
                  is_blocked: false
                },
                attributes: [
                  'id',
                  'name',
                  'email',
                  'phone',
                  'gender'
                ]
              }
            ]
          },
          {
            model: Specialization,
            as: 'specialization',
            required: true
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json(doctors);
    } catch (error) {
      console.error('getPublicDoctors error:', error);
      res.status(500).json({
        message: 'Failed to load public doctors',
        error: error.message
      });
    }
  },

  async getSpecializationList(req, res) {
    try {
      const specializations = await Specialization.findAll({
        attributes: ['id', 'name'],   // plural
        order: [['name', 'ASC']]
      });

      res.json(specializations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch specializations", error });
    }
  },

  async getHospitals(req, res) {
    try {
      const hospitals = await Hospital.findAll({
        attributes: ['id', 'name', 'location'],   // plural
        order: [['name', 'ASC']]
      });

      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospitals", error });
    }
  }

};
