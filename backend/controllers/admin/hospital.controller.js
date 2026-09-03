const {
  HospitalProfile,
  User,
  sequelize,
} = require("../../models");

const { Op } = require("sequelize");
const {
  PROFILE_REVIEW_STATUSES,
  buildAdminReviewUpdate,
  normalizeProfileReviewStatus
} = require('../../utils/providerReview');
const { findPublicHospitalProfiles } = require('../../utils/publicHospital');

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
  //  All Hospital Profiles (Admin)
  // ===============================
  async getHospitalUserProfiles(req, res) {
    try {
      const { status = "ALL" } = req.query;

      const userWhere = { role: "hospital" };
      const profileWhere = {};

      switch (status) {

        case "ACTIVE":
          userWhere.isActive = true;
          userWhere.isBlocked = false;
          profileWhere.verificationStatus = PROFILE_REVIEW_STATUSES.APPROVED;
          break;

        case "BLOCKED":
          userWhere[Op.or] = [
            { isActive: false },
            { isBlocked: true }
          ];
          break;

        case "VERIFIED":
        case "APPROVED":
          profileWhere.verificationStatus = PROFILE_REVIEW_STATUSES.APPROVED;
          userWhere.isBlocked = false; // optional, keeps list clean
          break;

        case "PENDING":
        case "UNDER_REVIEW":
        case "CHANGES_REQUESTED":
        case "REJECTED":
        case "SUSPENDED":
          profileWhere.verificationStatus = mapProfileStatusFilter(status);
          userWhere.isBlocked = false;
          break;

        default:
          // ALL → no extra filters
          break;
      }

      const users = await User.findAll({ 
            where: userWhere, 
          include: [ {
            model: HospitalProfile, as: "hospitalProfile",
            where: profileWhere,
            include: [{
              model: User,
              as: 'reviewedBy',
              required: false,
              attributes: ['id', 'name', 'email']
            }]
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
  // Verify / Unverify a Hospital Profile
  // ==================================
  async verifyHospitalProfile(req, res) {
    const t = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { status, reviewNotes, rejectionReason } = req.body;

      const profile = await HospitalProfile.findByPk(id, {
        include: [{ model: User, as: 'user' }],
        transaction: t
      });

      if (!profile) {
        await t.rollback();
        return res.status(404).json({ message: "Hospital profile not found" });
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

      const published = normalizeProfileReviewStatus(status) === PROFILE_REVIEW_STATUSES.APPROVED
        && profile.user.isActive && !profile.user.isBlocked;

      res.json({
        message: `Hospital profile moved to ${normalizeProfileReviewStatus(status).replace(/_/g, ' ')} successfully`,
        data: profile,
        publish: { published, hospitalId: profile.id }
      });
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }
      res.status(500).json({ message: "Failed to update review status", error: error.message });
    }
  },

  // ==================================
  // Public Hospital Listings
  // ==================================
    async getPublicHospitals(req, res) {
        try {
        const entries = await findPublicHospitalProfiles();
        const hospitals = entries.map(({ profile, specialties }) => ({
          id: profile.id,
          name: profile.hospitalName,
          email: profile.hospitalEmail,
          phone: profile.hospitalPhone,
          address: profile.hospitalAddress,
          location: [profile.hospitalCity, profile.hospitalState].filter(Boolean).join(', '),
          pincode: profile.hospitalPincode,
          website: profile.website,
          emergencyContactNumber: profile.emergencyContactNumber,
          established: profile.establishedYear,
          registration_number: profile.registrationNumber,
          hospital_type: profile.hospitalType,
          beds: profile.totalBeds,
          rating: profile.rating,
          discount: profile.discount,
          operating_hours: profile.operatingHours,
          emergency_available: profile.emergencyServices,
          ambulance_available: profile.ambulanceServices,
          description: profile.bio,
          is_published: true,
          verificationStatus: profile.verificationStatus,
          submittedAt: profile.submittedAt,
          reviewedAt: profile.reviewedAt,
          reviewedBy: profile.reviewedBy,
          reviewNotes: profile.reviewNotes,
          rejectionReason: profile.rejectionReason,
          verificationDocuments: profile.verificationDocuments,
          profileImageUrl: profile.profileImageUrl,
          profileImagePublished: !!profile.profileImagePublished,
          profileImageUploadedAt: profile.profileImageUploadedAt,
          bannerImageUrl: profile.bannerImageUrl,
          bannerImagePublished: !!profile.bannerImagePublished,
          bannerImageUploadedAt: profile.bannerImageUploadedAt,
          createdAt: profile.createdAt,
          specialties: specialties.map(specialty => ({
            ...specialty,
            HospitalSpecialty: { is_primary: false }
          })),
          facilities: [],
          accreditations: [],
          images: []
        }));

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
