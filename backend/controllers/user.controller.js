const {
  User,
  PatientProfile,
  DoctorProfile,
  HospitalProfile,
  Doctor,
  Hospital,
  Specialization
} = require("../models");

const { Op, Sequelize } = require("sequelize");

// GET all doctors
// The component will do client-side filtering, sorting in applyFiltersAndSort()
module.exports = {
  async getAllUsers(req, res) {
    
    try {
      const { status } = req.query;
      const where = {};

      if (status === "ACTIVE") {
        where.isActive = true;
      }

      if (status === "BLOCKED") {
        where.isBlocked = true;
      }
      
      const users = await User.findAll({
        where,
        include: [
          { model: PatientProfile, as: "patientProfile" },
          { model: DoctorProfile, as: "doctorProfile" },
          { model: HospitalProfile, as: "hospitalProfile" }
        ],
        order: [["created_at", "DESC"]]
      });
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error });
    }
  },

// exports.getUsersByFilter = async (req, res) => {
//   try {
//     const { role, status, is_active } = req.query;

//     const where = {};
//     if (role) where.role = role;
//     if (status) where.status = status;
//     if (is_active !== undefined) where.is_active = is_active;

//     const users = await User.findAll({ where });

//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to filter users", error });
//   }
// };

// exports.getUserDetails = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const user = await User.findByPk(id, {
//       include: [
//         {
//           model: PatientProfile
//         },
//         {
//           model: DoctorProfile,
//           include: [
//             { model: Doctor },
//             { model: Specialization }
//           ]
//         },
//         {
//           model: HospitalProfile,
//           include: [{ model: Hospital }]
//         }
//       ]
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch user details", error });
//   }
// };

// exports.approveUser = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const user = await User.findByPk(id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     user.status = "APPROVED";
//     user.is_verified = true;
//     user.is_active = true;

//     await user.save();

//     res.json({ message: "User approved successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Approval failed", error });
//   }
// };

// exports.rejectUser = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const user = await User.findByPk(id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     user.status = "REJECTED";
//     user.is_active = false;

//     await user.save();

//     res.json({ message: "User rejected successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Rejection failed", error });
//   }
// };

// exports.toggleUserActiveStatus = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const user = await User.findByPk(id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     user.is_active = !user.is_active;
//     await user.save();

//     res.json({
//       message: `User ${user.is_active ? "activated" : "blocked"} successfully`
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Status update failed", error });
//   }
// };


}