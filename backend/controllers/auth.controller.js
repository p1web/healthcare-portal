// controllers/auth.controller.js
const { User, PatientProfile, DoctorProfile, HospitalProfile } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Format user response
const formatUserResponse = (user, includeProfile = false) => {
  const userJSON = user.toJSON();
  
  const response = {
    id: userJSON.id,
    name: userJSON.name,
    email: userJSON.email,
    phone: userJSON.phone,
    role: userJSON.role,
    isEmailVerified: userJSON.isEmailVerified,
    isPhoneVerified: userJSON.isPhoneVerified,
    profileImage: userJSON.profileImage,
    dateOfBirth: userJSON.dateOfBirth,
    gender: userJSON.gender,
    address: userJSON.address,
    city: userJSON.city,
    state: userJSON.state,
    pincode: userJSON.pincode,
    country: userJSON.country,
    isActive: userJSON.isActive
  };

  if (includeProfile) {
    if (user.patientProfile) response.profile = user.patientProfile;
    if (user.doctorProfile) response.profile = user.doctorProfile;
    if (user.hospitalProfile) response.profile = user.hospitalProfile;
  }

  return response;
};

// REGISTER
exports.register = async (req, res) => {

  try {
    
    const { name, email, phone, password, role, termsAccepted } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the terms and conditions'
      });
    }

    // Validate role
    if (!['patient', 'doctor', 'hospital'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Phone number';
      return res.status(409).json({
        success: false,
        message: `${field} already registered`
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password, // Will be hashed by beforeCreate hook
      role,
      termsAcceptedAt: new Date()
    });

    // Create role-specific profile
    if (role === 'patient') {
      await PatientProfile.create({ userId: user.id });
    } else if (role === 'doctor') {
      await DoctorProfile.create({ userId: user.id });
    } else if (role === 'hospital') {
      await HospitalProfile.create({ userId: user.id });
    }

    // Generate token
    const token = generateToken(user);

    // Send verification email (implement later)
    // await sendVerificationEmail(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: formatUserResponse(user),
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Email or phone number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [
        { model: PatientProfile, as: 'patientProfile' },
        { model: DoctorProfile, as: 'doctorProfile' },
        { model: HospitalProfile, as: 'hospitalProfile' }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact support.'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUserResponse(user, true),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// GET CURRENT USER

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const user = await User.findByPk(userId, {
      include: [
        { model: PatientProfile, as: 'patientProfile' },
        { model: DoctorProfile, as: 'doctorProfile' },
        { model: HospitalProfile, as: 'hospitalProfile' }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatUserResponse(user, true)
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fields that can be updated
    const allowedFields = [
      'name', 'phone', 'dateOfBirth', 'gender', 
      'address', 'city', 'state', 'pincode', 'country', 'profileImage'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    await user.update(updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: formatUserResponse(user)
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate current password
    const isValid = await user.validatePassword(currentPassword);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.update({ password: newPassword }); // Will be hashed by hook

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// LOGOUT (Optional - mainly for token invalidation if using refresh tokens)
exports.logout = async (req, res) => {
  try {
    // If using refresh tokens, invalidate them here
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// FORGOT PASSWORD (Generate reset token)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'If email exists, password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = user.generateVerificationToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    // Send reset email (implement later)
    // await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email',
      // Remove this in production:
      resetToken // For testing only
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    await user.update({
      password: newPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};