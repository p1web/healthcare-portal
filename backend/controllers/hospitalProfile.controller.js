// controllers/hospitalProfile.controller.js
const { Op } = require('sequelize');
const { User, HospitalProfile, Specialty, sequelize } = require('../models');
const { applyUserBasicUpdates } = require('../utils/userBasicUpdate');
const {
  buildSubmittedReviewReset,
  canSubmitForReview,
  canEditProfile,
  getMissingRequiredFields
} = require('../utils/providerReview');

const HOSPITAL_REQUIRED_FIELDS = [
  'hospitalName', 'hospitalEmail', 'hospitalPhone',
  'emergencyContactNumber', 'hospitalAddress', 'hospitalCity',
  'hospitalState', 'hospitalPincode',
  'registrationNumber', 'establishedYear', 'totalBeds',
  'hospitalType', 'operatingHours', 'specialtyIds'
];

const PHONE_PATTERN = /^\d{10,15}$/;
const PINCODE_PATTERN = /^\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEBSITE_PATTERN = /^https?:\/\/.+/i;

function formatHospitalUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    address: user.address,
    city: user.city,
    state: user.state,
    pincode: user.pincode,
    country: user.country,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    hospitalProfile: user.hospitalProfile ? user.hospitalProfile.toJSON() : null
  };
}

// GET /api/hospital/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: HospitalProfile, as: 'hospitalProfile', required: false }]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: formatHospitalUser(user) });
  } catch (error) {
    console.error('Get hospital profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PUT /api/hospital/profile
exports.updateProfile = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { user = {}, hospitalProfile = {} } = req.body;
    const existingProfile = await HospitalProfile.findOne({ where: { userId }, transaction: t });

    const dbUser = await User.findByPk(userId, { transaction: t });
    if (!dbUser) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (dbUser.role !== 'hospital') {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Not a hospital account' });
    }

    if (existingProfile && !canEditProfile(existingProfile.verificationStatus)) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'Profile can only be updated while in Draft or Returned status'
      });
    }

    if (hospitalProfile.hospitalEmail && !EMAIL_PATTERN.test(String(hospitalProfile.hospitalEmail).trim())) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Enter a valid hospital email address' });
    }

    if (hospitalProfile.hospitalPhone && !PHONE_PATTERN.test(String(hospitalProfile.hospitalPhone).trim())) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Hospital contact number must contain 10 to 15 digits' });
    }

    if (hospitalProfile.emergencyContactNumber && !PHONE_PATTERN.test(String(hospitalProfile.emergencyContactNumber).trim())) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Emergency contact number must contain 10 to 15 digits' });
    }

    if (hospitalProfile.hospitalPincode && !PINCODE_PATTERN.test(String(hospitalProfile.hospitalPincode).trim())) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Hospital pincode must contain 6 digits' });
    }

    if (hospitalProfile.website && !WEBSITE_PATTERN.test(String(hospitalProfile.website).trim())) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Hospital website must start with http:// or https://' });
    }

    await applyUserBasicUpdates(dbUser, user, t);

    if (hospitalProfile.bio !== undefined && String(hospitalProfile.bio).length > 2000) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Hospital bio cannot exceed 2000 characters' });
    }

    if (hospitalProfile.specialtyIds !== undefined) {
      if (!Array.isArray(hospitalProfile.specialtyIds)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'specialtyIds must be an array' });
      }

      const specialtyIds = [...new Set(
        hospitalProfile.specialtyIds
          .map(Number)
          .filter(Number.isInteger)
          .filter(id => id > 0)
      )];

      if (specialtyIds.length !== hospitalProfile.specialtyIds.length) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'specialtyIds contains invalid values' });
      }

      const specialtyCount = await Specialty.count({
        where: { id: { [Op.in]: specialtyIds } },
        transaction: t
      });

      if (specialtyCount !== specialtyIds.length) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'One or more specialties do not exist' });
      }

      hospitalProfile.specialtyIds = specialtyIds;
    }

    const hospitalFields = [
      'hospitalName', 'hospitalEmail', 'hospitalPhone',
      'emergencyContactNumber', 'hospitalAddress', 'hospitalCity',
      'hospitalState', 'hospitalPincode', 'website',
      'registrationNumber', 'bio', 'specialtyIds', 'establishedYear', 'totalBeds',
      'hospitalType', 'operatingHours',
      'emergencyServices', 'ambulanceServices'
    ];

    const hospitalUpdates = Object.fromEntries(
      hospitalFields
        .filter(f => hospitalProfile[f] !== undefined)
        .map(f => [f, hospitalProfile[f]])
    );

    if (hospitalUpdates.bio !== undefined) {
      hospitalUpdates.bio = String(hospitalUpdates.bio).trim();
    }

    [
      'hospitalName', 'hospitalEmail', 'hospitalPhone',
      'emergencyContactNumber', 'hospitalAddress', 'hospitalCity',
      'hospitalState', 'hospitalPincode', 'website'
    ].forEach((field) => {
      if (hospitalUpdates[field] !== undefined) {
        hospitalUpdates[field] = String(hospitalUpdates[field]).trim();
      }
    });

    if (Object.keys(hospitalUpdates).length) {
      await HospitalProfile.upsert({
        id: existingProfile?.id,
        userId,
        ...hospitalUpdates
      }, { transaction: t });
    }

    await t.commit();

    const updatedUser = await User.findByPk(userId, {
      include: [{ model: HospitalProfile, as: 'hospitalProfile', required: false }]
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: formatHospitalUser(updatedUser)
    });
  } catch (err) {
    if (!t.finished) {
      await t.rollback();
    }

    console.error('Error updating hospital profile:', err);

    return res.status(500).json({
      success: false,
      message: err.message || 'Profile update failed'
    });
  }
};

// POST /api/hospital/profile/documents
exports.requireEditableProfile = async (req, res, next) => {
  try {
    const profile = await HospitalProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Hospital profile not found' });
    }

    if (!canEditProfile(profile.verificationStatus)) {
      return res.status(409).json({
        success: false,
        message: 'Documents can only be updated while the profile is in Draft or Returned status'
      });
    }

    req.providerProfile = profile;
    return next();
  } catch (error) {
    console.error('Hospital profile edit access error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify profile edit access' });
  }
};

exports.uploadDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const profile = req.providerProfile || await HospitalProfile.findOne({ where: { userId } });

    if (!canEditProfile(profile.verificationStatus)) {
      return res.status(409).json({
        success: false,
        message: 'Documents can only be updated while the profile is in Draft or Returned status'
      });
    }

    const newDocs = files.map(f => ({
      name: f.originalname,
      url: `/uploads/verification-documents/${userId}/${f.filename}`,
      uploadedAt: new Date().toISOString()
    }));

    await profile.update({
      verificationDocuments: [...profile.verificationDocuments, ...newDocs]
    });

    const updatedUser = await User.findByPk(userId, {
      include: [{ model: HospitalProfile, as: 'hospitalProfile', required: false }]
    });

    return res.json({
      success: true,
      message: 'Documents uploaded successfully. Submit your profile for review when ready.',
      data: formatHospitalUser(updatedUser)
    });
  } catch (err) {
    console.error('Error uploading hospital documents:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Document upload failed'
    });
  }
};

// POST /api/hospital/profile/submit
exports.submitForReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await HospitalProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Complete your profile before submitting it for review' });
    }

    if (!canSubmitForReview(profile.verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Profile cannot be submitted while in '${profile.verificationStatus}' status`
      });
    }

    const missingFields = getMissingRequiredFields(profile, HOSPITAL_REQUIRED_FIELDS);
    if (!profile.verificationDocuments || profile.verificationDocuments.length === 0) {
      missingFields.push('verificationDocuments');
    }

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: 'Complete all required fields and upload at least one document before submitting',
        missingFields
      });
    }

    await profile.update(buildSubmittedReviewReset());

    const updatedUser = await User.findByPk(userId, {
      include: [{ model: HospitalProfile, as: 'hospitalProfile', required: false }]
    });

    return res.json({
      success: true,
      message: 'Profile submitted for review. An admin will review it shortly.',
      data: formatHospitalUser(updatedUser)
    });
  } catch (err) {
    console.error('Error submitting hospital profile for review:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit profile for review'
    });
  }
};
