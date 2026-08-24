const { User } = require('../../models');

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
  return res.json({ success: true, data: formatAdminProfile(req.user) });
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'city', 'state', 'pincode', 'country'];
    const updates = Object.fromEntries(
      allowedFields
        .filter(field => req.body[field] !== undefined)
        .map(field => [field, typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]])
    );

    if (!updates.name || !updates.phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    await req.user.update(updates);
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: formatAdminProfile(req.user)
    });
  } catch (error) {
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