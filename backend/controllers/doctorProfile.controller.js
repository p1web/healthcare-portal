// controllers/doctorProfile.controller.js
const { User, DoctorProfile, DoctorAvailability, sequelize } = require('../models');
const { applyUserBasicUpdates } = require('../utils/userBasicUpdate');
const {
  buildSubmittedReviewReset,
  canSubmitForReview,
  canEditProfile,
  getMissingRequiredFields
} = require('../utils/providerReview');

const DOCTOR_REQUIRED_FIELDS = [
  'registrationNumber', 'qualification', 'specializationId',
  'yearsOfExperience', 'consultationFee', 'hospitalId'
];

const doctorProfileIncludes = [
  { model: DoctorProfile, as: 'doctorProfile', required: false, include: [
    { model: DoctorAvailability, as: 'availabilities', required: false }
  ] }
];

function formatAvailability(availabilities = []) {
  return availabilities
    .map(availability => ({
      id: availability.id,
      dayOfWeek: availability.day_of_week,
      startTime: String(availability.start_time).slice(0, 5),
      endTime: String(availability.end_time).slice(0, 5),
      isAvailable: availability.is_available
    }))
    .sort((left, right) => left.dayOfWeek - right.dayOfWeek);
}

function normalizeAvailability(availability) {
  if (!Array.isArray(availability)) {
    throw Object.assign(new Error('Availability must be an array'), { statusCode: 400 });
  }

  const activeSlots = availability.filter(slot => slot.isAvailable !== false).map(slot => ({
    dayOfWeek: Number(slot.dayOfWeek),
    startTime: String(slot.startTime || '').slice(0, 5),
    endTime: String(slot.endTime || '').slice(0, 5)
  }));
  const days = activeSlots.map(slot => slot.dayOfWeek);

  if (activeSlots.some(slot => !Number.isInteger(slot.dayOfWeek) || slot.dayOfWeek < 0 || slot.dayOfWeek > 6)) {
    throw Object.assign(new Error('Availability day must be between Sunday and Saturday'), { statusCode: 400 });
  }
  if (new Set(days).size !== days.length) {
    throw Object.assign(new Error('Only one availability slot is allowed per day'), { statusCode: 400 });
  }
  if (activeSlots.some(slot => !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.endTime))) {
    throw Object.assign(new Error('Availability times must use HH:mm format'), { statusCode: 400 });
  }
  if (activeSlots.some(slot => slot.startTime >= slot.endTime)) {
    throw Object.assign(new Error('Availability end time must be after start time'), { statusCode: 400 });
  }

  return activeSlots;
}

function formatDoctorUser(user) {
  const doctorProfile = user.doctorProfile ? user.doctorProfile.toJSON() : null;
  if (doctorProfile) {
    doctorProfile.availability = formatAvailability(doctorProfile.availabilities);
    delete doctorProfile.availabilities;
  }

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
    doctorProfile
  };
}

// GET /api/doctor/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: doctorProfileIncludes
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: formatDoctorUser(user) });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PUT /api/doctor/profile
exports.updateProfile = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { user = {}, doctorProfile = {}, availability } = req.body;
    const existingProfile = await DoctorProfile.findOne({ where: { userId }, transaction: t });

    const dbUser = await User.findByPk(userId, { transaction: t });
    if (!dbUser) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (dbUser.role !== 'doctor') {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Not a doctor account' });
    }

    if (existingProfile && !canEditProfile(existingProfile.verificationStatus)) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'Profile can only be updated while in Draft or Returned status'
      });
    }

    await applyUserBasicUpdates(dbUser, user, t);

    const doctorFields = [
      'registrationNumber', 'qualification', 'specializationId',
      'yearsOfExperience', 'consultationFee', 'hospitalId'
    ];

    const doctorUpdates = Object.fromEntries(
      doctorFields
        .filter(f => doctorProfile[f] !== undefined)
        .map(f => [f, doctorProfile[f]])
    );

    if (Object.keys(doctorUpdates).length) {
      await DoctorProfile.upsert({
        id: existingProfile?.id,
        userId,
        ...doctorUpdates
      }, { transaction: t });
    }

    if (availability !== undefined) {
      const profile = existingProfile || await DoctorProfile.findOne({ where: { userId }, transaction: t });
      if (!profile) {
        throw new Error('Save the doctor profile before adding availability');
      }

      const slots = normalizeAvailability(availability);
      await DoctorAvailability.destroy({ where: { doctor_profile_id: profile.id }, transaction: t });
      if (slots.length) {
        await DoctorAvailability.bulkCreate(slots.map(slot => ({
          doctor_profile_id: profile.id,
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_available: true
        })), { transaction: t });
      }
    }

    await t.commit();

    const updatedUser = await User.findByPk(userId, {
      include: doctorProfileIncludes
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: formatDoctorUser(updatedUser)
    });
  } catch (err) {
    if (!t.finished) {
      await t.rollback();
    }

    console.error('Error updating doctor profile:', err);

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Profile update failed'
    });
  }
};

// POST /api/doctor/profile/documents
exports.requireEditableProfile = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
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
    console.error('Doctor profile edit access error:', error);
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

    const profile = req.providerProfile || await DoctorProfile.findOne({ where: { userId } });

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
      include: doctorProfileIncludes
    });

    return res.json({
      success: true,
      message: 'Documents uploaded successfully. Submit your profile for review when ready.',
      data: formatDoctorUser(updatedUser)
    });
  } catch (err) {
    console.error('Error uploading doctor documents:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Document upload failed'
    });
  }
};

// POST /api/doctor/profile/submit
exports.submitForReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await DoctorProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Complete your profile before submitting it for review' });
    }

    if (!canSubmitForReview(profile.verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Profile cannot be submitted while in '${profile.verificationStatus}' status`
      });
    }

    const missingFields = getMissingRequiredFields(profile, DOCTOR_REQUIRED_FIELDS);
    const availabilityCount = await DoctorAvailability.count({
      where: { doctor_profile_id: profile.id, is_available: true }
    });
    if (!availabilityCount) {
      missingFields.push('availability');
    }
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
      include: doctorProfileIncludes
    });

    return res.json({
      success: true,
      message: 'Profile submitted for review. An admin will review it shortly.',
      data: formatDoctorUser(updatedUser)
    });
  } catch (err) {
    console.error('Error submitting doctor profile for review:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit profile for review'
    });
  }
};
