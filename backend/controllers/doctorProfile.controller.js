// controllers/doctorProfile.controller.js
const { User, DoctorProfile, sequelize } = require('../models');
const { applyUserBasicUpdates } = require('../utils/userBasicUpdate');

function formatDoctorUser(user) {
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
    doctorProfile: user.doctorProfile ? user.doctorProfile.toJSON() : null
  };
}

// GET /api/doctor/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: DoctorProfile, as: 'doctorProfile', required: false }]
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
    const { user = {}, doctorProfile = {} } = req.body;

    const dbUser = await User.findByPk(userId, { transaction: t });
    if (!dbUser) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (dbUser.role !== 'doctor') {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Not a doctor account' });
    }

    await applyUserBasicUpdates(dbUser, user, t);

    const doctorFields = [
      'registrationNumber', 'qualification', 'specializationId',
      'yearsOfExperience', 'consultationFee'
    ];

    const doctorUpdates = Object.fromEntries(
      doctorFields
        .filter(f => doctorProfile[f] !== undefined)
        .map(f => [f, doctorProfile[f]])
    );

    if (Object.keys(doctorUpdates).length) {
      await DoctorProfile.upsert({ userId, ...doctorUpdates }, { transaction: t });
    }

    await t.commit();

    const updatedUser = await User.findByPk(userId, {
      include: [{ model: DoctorProfile, as: 'doctorProfile', required: false }]
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

    return res.status(500).json({
      success: false,
      message: err.message || 'Profile update failed'
    });
  }
};
