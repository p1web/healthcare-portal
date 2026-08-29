'use strict';

const {
  DoctorPractice,
  DoctorProfile,
  HospitalProfile,
  User,
  Specialization,
  PlatformCommissionSettings
} = require('../../models');
const { PRACTICE_STATUSES, COMMISSION_MODES } = require('../../models/doctor-practice');
const {
  resolveCommissionMode,
  defaultPercentsForMode,
  getPlatformDefaults,
  invalidatePlatformDefaultsCache
} = require('../../utils/practiceCommission');

const num = (v) => (v !== null && v !== undefined) ? parseFloat(v) : 0;

function formatAdminPractice(practice) {
  const value = practice.toJSON ? practice.toJSON() : practice;
  return {
    id: value.id,
    doctorProfileId: value.doctorProfileId,
    hospitalProfileId: value.hospitalProfileId,
    consultationFee: num(value.consultationFee),
    isPrimary: !!value.isPrimary,
    isActive: !!value.isActive,
    status: value.status,
    commissionMode: value.commissionMode,
    platformCommissionPercent: num(value.platformCommissionPercent),
    hospitalPayoutPercent: num(value.hospitalPayoutPercent),
    doctorPayoutPercent: num(value.doctorPayoutPercent),
    commissionOverridden: !!value.commissionOverridden,
    notes: value.notes || null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    hospital: value.hospital ? {
      id: value.hospital.id,
      hospitalName: value.hospital.hospitalName,
      hospitalKind: value.hospital.hospitalKind,
      hospitalCity: value.hospital.hospitalCity,
      hospitalState: value.hospital.hospitalState,
      ownerUserId: value.hospital.userId
    } : null,
    doctor: value.doctor ? {
      id: value.doctor.id,
      registrationNumber: value.doctor.registrationNumber,
      qualification: value.doctor.qualification,
      ownerUserId: value.doctor.userId,
      user: value.doctor.user ? { id: value.doctor.user.id, name: value.doctor.user.name, email: value.doctor.user.email } : null,
      specialization: value.doctor.specialization ? { id: value.doctor.specialization.id, name: value.doctor.specialization.name } : null
    } : null
  };
}

exports.listPractices = async (req, res) => {
  try {
    const { status, hospitalProfileId, doctorProfileId, commissionMode } = req.query;
    const where = {};
    if (status && Object.values(PRACTICE_STATUSES).includes(status)) where.status = status;
    if (hospitalProfileId) where.hospitalProfileId = parseInt(hospitalProfileId, 10);
    if (doctorProfileId) where.doctorProfileId = parseInt(doctorProfileId, 10);
    if (commissionMode && Object.values(COMMISSION_MODES).includes(commissionMode)) where.commissionMode = commissionMode;

    const practices = await DoctorPractice.findAll({
      where,
      include: [
        {
          model: HospitalProfile,
          as: 'hospital',
          attributes: ['id', 'hospitalName', 'hospitalKind', 'hospitalCity', 'hospitalState', 'userId']
        },
        {
          model: DoctorProfile,
          as: 'doctor',
          attributes: ['id', 'registrationNumber', 'qualification', 'userId'],
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Specialization, as: 'specialization', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ success: true, data: practices.map(formatAdminPractice) });
  } catch (error) {
    console.error('Admin list practices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load practices' });
  }
};

exports.updatePractice = async (req, res) => {
  try {
    const practice = await DoctorPractice.findByPk(req.params.id, {
      include: [
        { model: HospitalProfile, as: 'hospital' },
        {
          model: DoctorProfile,
          as: 'doctor',
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Specialization, as: 'specialization', attributes: ['id', 'name'] }
          ]
        }
      ]
    });
    if (!practice) return res.status(404).json({ success: false, message: 'Practice not found' });

    const {
      commissionMode,
      platformCommissionPercent,
      hospitalPayoutPercent,
      doctorPayoutPercent,
      resetToDefaults,
      status,
      notes
    } = req.body || {};

    if (resetToDefaults === true) {
      const mode = resolveCommissionMode({ hospitalProfile: practice.hospital, doctorProfile: practice.doctor });
      const defaults = await getPlatformDefaults({ PlatformCommissionSettings, force: true });
      const percents = defaultPercentsForMode(mode, defaults);
      practice.commissionMode = mode;
      practice.platformCommissionPercent = percents.platform;
      practice.hospitalPayoutPercent = percents.hospital;
      practice.doctorPayoutPercent = percents.doctor;
      practice.commissionOverridden = false;
    } else {
      if (commissionMode && !Object.values(COMMISSION_MODES).includes(commissionMode)) {
        return res.status(400).json({ success: false, message: 'commissionMode must be single or split' });
      }
      const newMode = commissionMode || practice.commissionMode;
      const plat = platformCommissionPercent !== undefined ? Number(platformCommissionPercent) : num(practice.platformCommissionPercent);
      const hospPct = newMode === COMMISSION_MODES.SINGLE ? 0 : (hospitalPayoutPercent !== undefined ? Number(hospitalPayoutPercent) : num(practice.hospitalPayoutPercent));
      const docPct = newMode === COMMISSION_MODES.SINGLE ? 0 : (doctorPayoutPercent !== undefined ? Number(doctorPayoutPercent) : num(practice.doctorPayoutPercent));
      if ([plat, hospPct, docPct].some(v => !Number.isFinite(v) || v < 0 || v > 100)) {
        return res.status(400).json({ success: false, message: 'Percents must be between 0 and 100' });
      }
      if (plat + hospPct + docPct > 100) {
        return res.status(400).json({ success: false, message: 'Percents sum must not exceed 100' });
      }
      practice.commissionMode = newMode;
      practice.platformCommissionPercent = plat;
      practice.hospitalPayoutPercent = hospPct;
      practice.doctorPayoutPercent = docPct;
      practice.commissionOverridden = true;
    }

    if (status && Object.values(PRACTICE_STATUSES).includes(status)) {
      practice.status = status;
      practice.isActive = status === PRACTICE_STATUSES.ACTIVE;
    }
    if (notes !== undefined) practice.notes = notes ? String(notes).trim() : null;

    await practice.save();
    return res.json({ success: true, data: formatAdminPractice(practice) });
  } catch (error) {
    console.error('Admin update practice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update practice' });
  }
};

exports.getCommissionSettings = async (req, res) => {
  try {
    const row = await PlatformCommissionSettings.findOne({ order: [['id', 'ASC']] });
    if (!row) return res.status(404).json({ success: false, message: 'Commission settings not configured' });
    return res.json({
      success: true,
      data: {
        id: row.id,
        defaultSoloCommissionPercent: num(row.defaultSoloCommissionPercent),
        defaultSplitPlatformCommissionPercent: num(row.defaultSplitPlatformCommissionPercent),
        defaultSplitHospitalPayoutPercent: num(row.defaultSplitHospitalPayoutPercent),
        defaultSplitDoctorPayoutPercent: num(row.defaultSplitDoctorPayoutPercent),
        updatedByUserId: row.updatedByUserId,
        updatedAt: row.updatedAt
      }
    });
  } catch (error) {
    console.error('Get commission settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load commission settings' });
  }
};

exports.updateCommissionSettings = async (req, res) => {
  try {
    const row = await PlatformCommissionSettings.findOne({ order: [['id', 'ASC']] });
    if (!row) return res.status(404).json({ success: false, message: 'Commission settings not configured' });

    const {
      defaultSoloCommissionPercent,
      defaultSplitPlatformCommissionPercent,
      defaultSplitHospitalPayoutPercent,
      defaultSplitDoctorPayoutPercent
    } = req.body || {};

    const solo = Number(defaultSoloCommissionPercent);
    const splitPlat = Number(defaultSplitPlatformCommissionPercent);
    const splitHosp = Number(defaultSplitHospitalPayoutPercent);
    const splitDoc = Number(defaultSplitDoctorPayoutPercent);

    if ([solo, splitPlat, splitHosp, splitDoc].some(v => !Number.isFinite(v) || v < 0 || v > 100)) {
      return res.status(400).json({ success: false, message: 'All percents must be between 0 and 100' });
    }
    if (solo > 100) return res.status(400).json({ success: false, message: 'Solo commission cannot exceed 100%' });
    if (splitPlat + splitHosp + splitDoc > 100) {
      return res.status(400).json({ success: false, message: 'Split percents sum must not exceed 100' });
    }

    row.defaultSoloCommissionPercent = solo;
    row.defaultSplitPlatformCommissionPercent = splitPlat;
    row.defaultSplitHospitalPayoutPercent = splitHosp;
    row.defaultSplitDoctorPayoutPercent = splitDoc;
    row.updatedByUserId = req.user.id;
    await row.save();

    invalidatePlatformDefaultsCache();

    return res.json({ success: true, data: { id: row.id } });
  } catch (error) {
    console.error('Update commission settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update commission settings' });
  }
};

exports.formatAdminPractice = formatAdminPractice;
