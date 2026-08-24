const {
  DoctorProfile,
  User,
  Specialization,
  HospitalProfile,
  DoctorAvailability,
  sequelize,
} = require("../../models");

const { Op } = require("sequelize");
const {
  PROFILE_REVIEW_STATUSES,
  buildAdminReviewUpdate,
  normalizeProfileReviewStatus
} = require('../../utils/providerReview');

function mapProfileStatusFilter(status) {
  switch (String(status || 'ALL').toUpperCase()) {
    case 'ACTIVE':
    case 'VERIFIED':
    case 'APPROVED':
      return PROFILE_REVIEW_STATUSES.APPROVED;
    case 'PENDING':
      return {
        [Op.in]: [
          PROFILE_REVIEW_STATUSES.DRAFT,
          PROFILE_REVIEW_STATUSES.SUBMITTED,
          PROFILE_REVIEW_STATUSES.UNDER_REVIEW,
          PROFILE_REVIEW_STATUSES.CHANGES_REQUESTED
        ]
      };
    case 'REJECTED':
      return PROFILE_REVIEW_STATUSES.REJECTED;
    case 'UNDER_REVIEW':
      return PROFILE_REVIEW_STATUSES.UNDER_REVIEW;
    case 'CHANGES_REQUESTED':
      return PROFILE_REVIEW_STATUSES.CHANGES_REQUESTED;
    case 'SUSPENDED':
      return PROFILE_REVIEW_STATUSES.SUSPENDED;
    default:
      return null;
  }
}

module.exports = {

  // ===============================
  //  All Doctor Profiles (Admin)
  // ===============================
  async getDoctorProfiles(req, res) {
    try {
      const { status = "ALL" } = req.query;
      const publicListing = status === "ACTIVE";

      const userWhere = { role: "doctor" };
      const profileWhere = {};

      switch (status) {

        case "ACTIVE":
          userWhere.is_active = true;
          userWhere.is_blocked = false;
          profileWhere.verification_status = PROFILE_REVIEW_STATUSES.APPROVED;
          break;

        case "BLOCKED":
          userWhere[Op.or] = [
            { is_active: false },
            { is_blocked: true }
          ];
          break;

        case "VERIFIED":
        case "APPROVED":
          profileWhere.verification_status = PROFILE_REVIEW_STATUSES.APPROVED;
          userWhere.is_blocked = false; // optional, keeps list clean
          break;

        case "PENDING":
        case "UNDER_REVIEW":
        case "CHANGES_REQUESTED":
        case "REJECTED":
        case "SUSPENDED":
          profileWhere.verification_status = mapProfileStatusFilter(status);
          userWhere.is_blocked = false;
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
          {
            model: User,
            as: 'reviewedBy',
            required: false,
            attributes: ['id', 'name', 'email']
          },
          {
            model: Specialization,
            as: 'specialization',
            required: publicListing,
            attributes: ['id', 'name']
          },
          {
            model: HospitalProfile,
            as: 'hospital',
            required: publicListing,
            attributes: ['id', 'hospitalName', 'hospitalCity', 'hospitalState']
          },
          {
            model: DoctorAvailability,
            as: 'availabilities',
            required: false,
            attributes: ['id', 'day_of_week', 'start_time', 'end_time', 'is_available']
          },
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
  // Verify / Unverify a Doctor Profile
  // ==================================
  async verifyDoctorProfile(req, res) {
    const t = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { status, reviewNotes, rejectionReason } = req.body;

      const profile = await DoctorProfile.findByPk(id, {
        include: [{ model: User, as: 'user' }],
        transaction: t
      });

      if (!profile) {
        await t.rollback();
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      const reviewUpdate = buildAdminReviewUpdate({
        currentStatus: profile.verificationStatus,
        status,
        reviewerId: req.user.id,
        reviewNotes,
        rejectionReason
      });

      await profile.update(reviewUpdate, { transaction: t });

      await t.commit();

      const isPublic = normalizeProfileReviewStatus(status) === PROFILE_REVIEW_STATUSES.APPROVED
        && profile.user.isActive && !profile.user.isBlocked;
      res.json({
        message: `Doctor profile moved to ${normalizeProfileReviewStatus(status).replace(/_/g, ' ')} successfully`,
        data: profile,
        publish: { published: isPublic, doctorId: profile.id }
      });
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }
      res.status(500).json({ message: "Failed to update review status", error: error.message });
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
      const hospitals = await HospitalProfile.findAll({
        where: { verificationStatus: PROFILE_REVIEW_STATUSES.APPROVED },
        attributes: ['id', ['hospital_name', 'name'], ['hospital_city', 'location']],
        order: [['hospitalName', 'ASC']]
      });

      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospitals", error });
    }
  }

};
