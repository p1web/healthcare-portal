const {
  User,
  PatientProfile,
  PatientAllergy,
  PatientMedicalCondition,
  DoctorProfile,
  DoctorAvailability,
  HospitalProfile,
  Specialization,
  sequelize
} = require("../../models");

const { Op, Sequelize } = require("sequelize");

module.exports = {
  async getAllUsers(req, res) {
    
    try {
      const { status, role } = req.query;
      const where = {};

      if (status === "ACTIVE") {
        where.isActive = true;
        where.isBlocked = false;
      }

      if (status === "BLOCKED") {
        // Include any legacy non-active row in the Blocked result.
        where[Op.or] = [{ isBlocked: true }, { isActive: false }];
      }

      if (role && role !== "ALL") {
        where.role = role;
      }

      const users = await User.findAll({
        where,
        include: [
          {
            model: PatientProfile,
            as: "patientProfile",
            include: [
              { model: PatientAllergy, as: "allergies" },
              { model: PatientMedicalCondition, as: "medicalConditions" }
            ]
          },
          {
            model: DoctorProfile,
            as: "doctorProfile",
            include: [
              { model: Specialization, as: "specialization", attributes: ["id", "name"] },
              { model: User, as: "reviewedBy", attributes: ["id", "name", "email"] },
              { model: DoctorAvailability, as: "availabilities" }
            ]
          },
          { model: HospitalProfile, as: "hospitalProfile" }
        ],
        order: [["created_at", "DESC"]]
      });
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error });
    }
  },

  async updateAccountStatus(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(req.params.id, { transaction });
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'User not found' });
      }

      if (!['patient', 'doctor', 'hospital'].includes(user.role)) {
        await transaction.rollback();
        return res.status(403).json({ message: 'Only patient, doctor, and hospital accounts can be managed here' });
      }

      const accountStatus = String(req.body.status || '').trim().toLowerCase();
      const statusUpdates = {
        active: { isActive: true, isBlocked: false },
        blocked: { isActive: false, isBlocked: true }
      };

      if (!statusUpdates[accountStatus]) {
        await transaction.rollback();
        return res.status(400).json({ message: "Status must be 'active' or 'blocked'" });
      }

      await user.update(statusUpdates[accountStatus], { transaction });

      await transaction.commit();
      return res.json({
        message: `${user.role} account ${accountStatus} successfully`,
        data: { id: user.id, isActive: user.isActive, isBlocked: user.isBlocked }
      });
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      console.error('Account status update failed:', error);
      return res.status(500).json({ message: 'Failed to update account status' });
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