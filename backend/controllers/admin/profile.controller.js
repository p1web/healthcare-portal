const { User } = require('../../models');
const { userLocationIncludes } = require('../../utils/locationIncludes');
const { resolveLocationIds } = require('../../utils/userBasicUpdate');

function formatAdminProfile(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    address: user.address,
    city: user.city,
    state: user.state,
    districtId: user.districtId,
    stateId: user.stateId,
    pincode: user.pincode,
    country: user.country,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    isActive: user.isActive,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { include: userLocationIncludes() });
    return res.json({ success: true, data: formatAdminProfile(user) });
  } catch (error) {
    console.error('Get admin profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'districtId', 'stateId', 'pincode', 'country'];
    const updates = Object.fromEntries(
      allowedFields
        .filter(field => req.body[field] !== undefined)
        .map(field => [field, typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]])
    );

    if (!updates.name || !updates.phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const locationUpdates = await resolveLocationIds({
      stateId: req.body.stateId,
      districtId: req.body.districtId,
      stateName: req.body.state,
      districtName: req.body.city,
      existingStateId: req.user.stateId,
      existingDistrictId: req.user.districtId
    });
    if (locationUpdates) Object.assign(updates, locationUpdates);

    await req.user.update(updates);
    const updatedUser = await User.findByPk(req.user.id, { include: userLocationIncludes() });
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: formatAdminProfile(updatedUser)
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Phone number is already in use' });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: error.errors?.[0]?.message || 'Invalid profile data' });
    }
    console.error('Update admin profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};