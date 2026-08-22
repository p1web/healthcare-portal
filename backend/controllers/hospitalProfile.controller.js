// controllers/hospitalProfile.controller.js
const { User, HospitalProfile, sequelize } = require('../models');
const { applyUserBasicUpdates } = require('../utils/userBasicUpdate');

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

    const dbUser = await User.findByPk(userId, { transaction: t });
    if (!dbUser) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (dbUser.role !== 'hospital') {
      await t.rollback();
      return res.status(403).json({ success: false, message: 'Not a hospital account' });
    }

    await applyUserBasicUpdates(dbUser, user, t);

    const hospitalFields = [
      'registrationNumber', 'establishedYear', 'totalBeds',
      'hospitalType', 'operatingHours',
      'emergencyServices', 'ambulanceServices'
    ];

    const hospitalUpdates = Object.fromEntries(
      hospitalFields
        .filter(f => hospitalProfile[f] !== undefined)
        .map(f => [f, hospitalProfile[f]])
    );

    if (Object.keys(hospitalUpdates).length) {
      await HospitalProfile.upsert({ userId, ...hospitalUpdates }, { transaction: t });
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
