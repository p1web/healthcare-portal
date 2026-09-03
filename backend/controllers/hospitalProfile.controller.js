// controllers/hospitalProfile.controller.js
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { User, HospitalProfile, HospitalStaff, Specialty, sequelize } = require('../models');
const { applyUserBasicUpdates } = require('../utils/userBasicUpdate');
const {
  buildSubmittedReviewReset,
  canSubmitForReview,
  canEditProfile,
  getMissingRequiredFields
} = require('../utils/providerReview');
const {
  IMAGE_RULES,
  validateHospitalImageFile,
  safeUnlink
} = require('../middleware/hospitalImage.middleware');

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

    // defaultConsultationFee is managed by the system admin; silently strip if sent.
    if (hospitalProfile.defaultConsultationFee !== undefined) {
      delete hospitalProfile.defaultConsultationFee;
    }

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

exports.updateConsultationFee = async (req, res) => {
  try {
    const profile = await HospitalProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Hospital profile not found' });
    }

    const mode = String(req.body?.consultationFeeMode || '').trim().toUpperCase();
    const defaultFee = Number(req.body?.defaultConsultationFee);
    if (!['STANDARD', 'PER_DOCTOR'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Invalid consultation fee mode' });
    }
    if (mode === 'STANDARD' && (!Number.isFinite(defaultFee) || defaultFee <= 0)) {
      return res.status(400).json({ success: false, message: 'Standard consultation fee must be greater than zero' });
    }
    if (mode === 'PER_DOCTOR') {
      const bookableDoctors = await HospitalStaff.findAll({
        where: { hospitalProfileId: profile.id, isActive: true, isBookable: true },
        attributes: ['id', 'name', 'consultationFee']
      });
      const missingFees = bookableDoctors.filter(doctor => !(Number(doctor.consultationFee) > 0));
      if (missingFees.length) {
        return res.status(409).json({
          success: false,
          message: 'Set a consultation fee for every bookable doctor before enabling Doctor-specific fees',
          data: { incompleteDoctorIds: missingFees.map(doctor => doctor.id) }
        });
      }
    }

    const updates = { consultationFeeMode: mode };
    if (mode === 'STANDARD') updates.defaultConsultationFee = defaultFee;
    await profile.update(updates);
    return res.json({
      success: true,
      message: 'Consultation pricing updated',
      data: {
        consultationFeeMode: profile.consultationFeeMode,
        defaultConsultationFee: Number(profile.defaultConsultationFee)
      }
    });
  } catch (error) {
    console.error('Update consultation pricing error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update consultation pricing' });
  }
};

// -----------------------------------------------------------------------------
// Public profile & banner image uploads
// -----------------------------------------------------------------------------

const IMAGE_SLOT_FIELDS = {
  profile: {
    urlField: 'profileImageUrl',
    publishedField: 'profileImagePublished',
    uploadedAtField: 'profileImageUploadedAt'
  },
  banner: {
    urlField: 'bannerImageUrl',
    publishedField: 'bannerImagePublished',
    uploadedAtField: 'bannerImageUploadedAt'
  }
};

function absoluteUploadPath(relativeUrl) {
  return path.join(__dirname, '..', String(relativeUrl || '').replace(/^\//, ''));
}

async function handleImageUpload(slot, req, res) {
  const fields = IMAGE_SLOT_FIELDS[slot];
  const rules = IMAGE_RULES[slot];
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  const validation = validateHospitalImageFile(slot, file.path);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const userId = req.user.id;
  const profile = await HospitalProfile.findOne({ where: { userId } });
  if (!profile) {
    safeUnlink(file.path);
    return res.status(404).json({ success: false, message: 'Hospital profile not found. Complete your profile first.' });
  }

  const previousUrl = profile[fields.urlField];
  const relativeUrl = `/uploads/${rules.subfolder}/${userId}/${file.filename}`;

  // A fresh upload always starts unpublished so the hospital can preview it first.
  await profile.update({
    [fields.urlField]: relativeUrl,
    [fields.publishedField]: false,
    [fields.uploadedAtField]: new Date()
  });

  if (previousUrl && previousUrl.startsWith(`/uploads/${rules.subfolder}/${userId}/`)) {
    safeUnlink(absoluteUploadPath(previousUrl));
  }

  return res.json({
    success: true,
    message: `${slot === 'banner' ? 'Banner' : 'Profile'} image uploaded. Toggle "Publish" to make it visible on public pages.`,
    data: {
      slot,
      url: relativeUrl,
      published: false,
      uploadedAt: profile[fields.uploadedAtField],
      dimensions: validation.dimensions
    }
  });
}

async function handleImageRemove(slot, req, res) {
  const fields = IMAGE_SLOT_FIELDS[slot];
  const rules = IMAGE_RULES[slot];
  const userId = req.user.id;

  const profile = await HospitalProfile.findOne({ where: { userId } });
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Hospital profile not found' });
  }

  const previousUrl = profile[fields.urlField];
  await profile.update({
    [fields.urlField]: null,
    [fields.publishedField]: false,
    [fields.uploadedAtField]: null
  });

  if (previousUrl && previousUrl.startsWith(`/uploads/${rules.subfolder}/${userId}/`)) {
    safeUnlink(absoluteUploadPath(previousUrl));
  }

  return res.json({
    success: true,
    message: `${slot === 'banner' ? 'Banner' : 'Profile'} image removed`
  });
}

async function handleImagePublish(slot, req, res) {
  const fields = IMAGE_SLOT_FIELDS[slot];
  const desired = req.body?.published;
  if (typeof desired !== 'boolean') {
    return res.status(400).json({ success: false, message: '`published` must be true or false' });
  }

  const profile = await HospitalProfile.findOne({ where: { userId: req.user.id } });
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Hospital profile not found' });
  }

  if (desired && !profile[fields.urlField]) {
    return res.status(400).json({ success: false, message: `Upload a ${slot} image before publishing` });
  }

  await profile.update({ [fields.publishedField]: desired });

  return res.json({
    success: true,
    message: desired
      ? `${slot === 'banner' ? 'Banner' : 'Profile'} image is now visible on public pages`
      : `${slot === 'banner' ? 'Banner' : 'Profile'} image has been unpublished`,
    data: { slot, published: desired }
  });
}

// POST /api/hospital/profile/logo-image
exports.uploadProfileImage = async (req, res) => {
  try {
    return await handleImageUpload('profile', req, res);
  } catch (err) {
    console.error('Error uploading hospital profile image:', err);
    if (req.file) safeUnlink(req.file.path);
    return res.status(500).json({ success: false, message: err.message || 'Profile image upload failed' });
  }
};

// DELETE /api/hospital/profile/logo-image
exports.removeProfileImage = async (req, res) => {
  try {
    return await handleImageRemove('profile', req, res);
  } catch (err) {
    console.error('Error removing hospital profile image:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to remove profile image' });
  }
};

// PATCH /api/hospital/profile/logo-image/publish
exports.setProfileImagePublished = async (req, res) => {
  try {
    return await handleImagePublish('profile', req, res);
  } catch (err) {
    console.error('Error publishing hospital profile image:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update publish state' });
  }
};

// POST /api/hospital/profile/banner-image
exports.uploadBannerImage = async (req, res) => {
  try {
    return await handleImageUpload('banner', req, res);
  } catch (err) {
    console.error('Error uploading hospital banner image:', err);
    if (req.file) safeUnlink(req.file.path);
    return res.status(500).json({ success: false, message: err.message || 'Banner image upload failed' });
  }
};

// DELETE /api/hospital/profile/banner-image
exports.removeBannerImage = async (req, res) => {
  try {
    return await handleImageRemove('banner', req, res);
  } catch (err) {
    console.error('Error removing hospital banner image:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to remove banner image' });
  }
};

// PATCH /api/hospital/profile/banner-image/publish
exports.setBannerImagePublished = async (req, res) => {
  try {
    return await handleImagePublish('banner', req, res);
  } catch (err) {
    console.error('Error publishing hospital banner image:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update publish state' });
  }
};

