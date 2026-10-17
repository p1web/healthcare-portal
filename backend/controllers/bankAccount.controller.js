'use strict';

const { DoctorProfile, HospitalProfile, ProviderBankAccount } = require('../models');
const { PROFILE_REVIEW_STATUSES } = require('../utils/providerReview');
const { encryptBankDetails, decryptBankDetails } = require('../utils/bankAccountEncryption');

const profileModels = {
  doctor: DoctorProfile,
  hospital: HospitalProfile
};
const finalVerificationStatuses = new Set([
  PROFILE_REVIEW_STATUSES.APPROVED,
  PROFILE_REVIEW_STATUSES.REJECTED,
  PROFILE_REVIEW_STATUSES.SUSPENDED
]);

function isVerificationFinal(status) {
  return finalVerificationStatuses.has(status);
}

async function getProviderProfile(user) {
  const Profile = profileModels[user.role];
  if (!Profile) return null;
  return Profile.findOne({
    where: { userId: user.id },
    attributes: ['id', 'verificationStatus']
  });
}

function formatBankDetails(details) {
  return {
    ...details,
    confirmAccountNumber: details.accountNumber
  };
}

function validateBankDetails(body = {}) {
  const details = {
    accountHolderName: String(body.accountHolderName || '').trim(),
    bankName: String(body.bankName || '').trim(),
    accountNumber: String(body.accountNumber || '').trim(),
    ifscCode: String(body.ifscCode || '').trim().toUpperCase(),
    branchName: String(body.branchName || '').trim(),
    accountType: String(body.accountType || '').trim().toLowerCase(),
    upiId: String(body.upiId || '').trim()
  };

  if (details.accountHolderName.length < 3 || details.accountHolderName.length > 150) {
    return { error: 'Account holder name must be between 3 and 150 characters' };
  }
  if (!details.bankName || details.bankName.length > 150) {
    return { error: 'Bank name is required and must be at most 150 characters' };
  }
  if (!/^[0-9]{9,18}$/.test(details.accountNumber)) {
    return { error: 'Account number must contain 9 to 18 digits' };
  }
  if (String(body.confirmAccountNumber || '').trim() !== details.accountNumber) {
    return { error: 'Account numbers do not match' };
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(details.ifscCode)) {
    return { error: 'Enter a valid 11-character IFSC code' };
  }
  if (!['savings', 'current'].includes(details.accountType)) {
    return { error: 'Account type must be savings or current' };
  }
  if (details.branchName.length > 150) {
    return { error: 'Branch name must be at most 150 characters' };
  }
  if (details.upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(details.upiId)) {
    return { error: 'Enter a valid UPI ID' };
  }

  return { details };
}

exports.getMine = async (req, res) => {
  try {
    const profile = await getProviderProfile(req.user);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    const row = await ProviderBankAccount.findOne({
      where: { userId: req.user.id, userRole: req.user.role }
    });
    const details = row ? formatBankDetails(decryptBankDetails(row.encryptedDetails)) : null;

    return res.json({
      success: true,
      data: details,
      locked: isVerificationFinal(profile.verificationStatus)
    });
  } catch (error) {
    console.error('Get bank account details error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load bank account details' });
  }
};

exports.saveMine = async (req, res) => {
  try {
    const profile = await getProviderProfile(req.user);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }
    if (isVerificationFinal(profile.verificationStatus)) {
      return res.status(409).json({
        success: false,
        message: 'Bank account details cannot be changed after provider verification is approved'
      });
    }

    const { details, error } = validateBankDetails(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const encryptedDetails = encryptBankDetails(details);
    const [row, created] = await ProviderBankAccount.findOrCreate({
      where: { userId: req.user.id, userRole: req.user.role },
      defaults: {
        userId: req.user.id,
        userRole: req.user.role,
        encryptedDetails
      }
    });
    if (!created) await row.update({ encryptedDetails });

    return res.json({
      success: true,
      message: 'Bank account details saved successfully',
      data: formatBankDetails(details),
      locked: false
    });
  } catch (error) {
    console.error('Save bank account details error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to save bank account details' });
  }
};