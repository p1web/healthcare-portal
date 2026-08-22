// controllers/patientProfile.controller.js
const { User, PatientProfile, PatientAllergy, PatientMedicalCondition, sequelize } = require('../models');
const { applyUserBasicUpdates } = require('../utils/userBasicUpdate');

function formatPatientUser(user) {
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
    patientProfile: user.patientProfile ? user.patientProfile.toJSON() : null
  };
}

const patientProfileInclude = {
  model: PatientProfile,
  as: 'patientProfile',
  required: false,
  include: [
    { model: PatientAllergy, as: 'allergies' },
    { model: PatientMedicalCondition, as: 'medicalConditions' }
  ]
};

// GET /api/patient/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { include: [patientProfileInclude] });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: formatPatientUser(user) });
  } catch (error) {
    console.error('Get patient profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PUT /api/patient/profile
exports.updateProfile = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { user = {}, patientProfile = {} } = req.body;

    const dbUser = await User.findByPk(userId, { transaction: t });
    if (!dbUser) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (dbUser.role !== 'patient') {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Not a patient account' });
    }

    await applyUserBasicUpdates(dbUser, user, t);

    // NOTE: allergies/medicalConditions are managed via /api/patient/allergies
    // and /api/patient/medical-conditions (history-tracked), not here.
    const patientFields = [
      'bloodGroup', 'height', 'weight',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelation'
    ];

    const patientUpdates = Object.fromEntries(
      patientFields
        .filter(f => patientProfile[f] !== undefined)
        .map(f => [f, patientProfile[f]])
    );

    if (Object.keys(patientUpdates).length) {
      await PatientProfile.upsert({ userId, ...patientUpdates }, { transaction: t });
    }

    await t.commit();

    const updatedUser = await User.findByPk(userId, { include: [patientProfileInclude] });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: formatPatientUser(updatedUser)
    });
  } catch (err) {
    if (!t.finished) {
      await t.rollback();
    }

    console.error('Error updating patient profile:', err);

    return res.status(500).json({
      success: false,
      message: err.message || 'Profile update failed'
    });
  }
};
