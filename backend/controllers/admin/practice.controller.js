'use strict';

const {
  DoctorPractice,
  DoctorProfile,
  HospitalProfile,
  User,
  Specialization,
  PlatformCommissionSettings
} = require('../../models');
const { PRACTICE_STATUSES } = require('../../models/doctor-practice');
const { invalidatePlatformDefaultsCache } = require('../../utils/practiceCommission');

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
    platformCommissionPercent: num(value.platformCommissionPercent),
    notes: value.notes || null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    hospital: value.hospital ? {
      id: value.hospital.id,
      hospitalName: value.hospital.hospitalName,
      hospitalKind: value.hospital.hospitalKind,
      hospitalCity: value.hospital.hospitalCity,
      hospitalState: value.hospital.hospitalState,
      ownerUserId: value.hospital.userId,
      hospitalCommissionPercent: num(value.hospital.hospitalCommissionPercent)
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
    const { status, hospitalProfileId, doctorProfileId } = req.query;
    const where = {};
    if (status && Object.values(PRACTICE_STATUSES).includes(status)) where.status = status;
    if (hospitalProfileId) where.hospitalProfileId = parseInt(hospitalProfileId, 10);
    if (doctorProfileId) where.doctorProfileId = parseInt(doctorProfileId, 10);

    const practices = await DoctorPractice.findAll({
      where,
      include: [
        {
          model: HospitalProfile,
          as: 'hospital',
          attributes: ['id', 'hospitalName', 'hospitalKind', 'hospitalCity', 'hospitalState', 'userId', 'hospitalCommissionPercent']
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

// Admin update: fee/notes/status only (commission percent is now per-hospital).
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

    const { consultationFee, status, notes } = req.body || {};

    if (consultationFee !== undefined) {
      const fee = Number(consultationFee);
      if (!Number.isFinite(fee) || fee < 0) {
        return res.status(400).json({ success: false, message: 'consultationFee must be >= 0' });
      }
      practice.consultationFee = fee;
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

// Admin approves or rejects a hospital-initiated affiliation request.
exports.reviewPractice = async (req, res) => {
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

    const { action, reason } = req.body || {};
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "approve" or "reject"' });
    }
    if (practice.status !== PRACTICE_STATUSES.PENDING_ADMIN_APPROVAL) {
      return res.status(409).json({ success: false, message: 'This affiliation is not pending admin review' });
    }

    if (action === 'approve') {
      practice.status = PRACTICE_STATUSES.ACTIVE;
      practice.isActive = true;
      // If the doctor has no primary yet, mark this one primary.
      const primaryCount = await DoctorPractice.count({
        where: { doctorProfileId: practice.doctorProfileId, isPrimary: true }
      });
      if (primaryCount === 0) practice.isPrimary = true;
    } else {
      practice.status = PRACTICE_STATUSES.REJECTED;
      practice.isActive = false;
      if (reason) practice.notes = String(reason).trim();
    }
    await practice.save();
    return res.json({ success: true, data: formatAdminPractice(practice) });
  } catch (error) {
    console.error('Admin review practice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to review affiliation' });
  }
};

// Admin: list all hospitals with their MOU commission rate.
exports.listHospitalCommissions = async (req, res) => {
  try {
    const hospitals = await HospitalProfile.findAll({
      attributes: ['id', 'hospitalName', 'hospitalKind', 'hospitalCity', 'hospitalState', 'hospitalCommissionPercent', 'verificationStatus'],
      order: [['hospitalName', 'ASC']]
    });
    return res.json({
      success: true,
      data: hospitals.map(h => ({
        id: h.id,
        hospitalName: h.hospitalName,
        hospitalKind: h.hospitalKind,
        hospitalCity: h.hospitalCity,
        hospitalState: h.hospitalState,
        verificationStatus: h.verificationStatus,
        hospitalCommissionPercent: num(h.hospitalCommissionPercent)
      }))
    });
  } catch (error) {
    console.error('List hospital commissions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load hospital commissions' });
  }
};

exports.updateHospitalCommission = async (req, res) => {
  try {
    const id = parseInt(req.params.hospitalProfileId, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hospital id' });
    }
    const rate = Number(req.body?.hospitalCommissionPercent);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ success: false, message: 'hospitalCommissionPercent must be between 0 and 100' });
    }
    const hospital = await HospitalProfile.findByPk(id);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    hospital.hospitalCommissionPercent = rate;
    await hospital.save();

    // Keep the practice-row snapshot aligned so booking amounts stay in sync.
    await DoctorPractice.update(
      { platformCommissionPercent: rate },
      { where: { hospitalProfileId: id } }
    );

    return res.json({
      success: true,
      data: {
        id: hospital.id,
        hospitalName: hospital.hospitalName,
        hospitalCommissionPercent: num(hospital.hospitalCommissionPercent)
      }
    });
  } catch (error) {
    console.error('Update hospital commission error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update commission rate' });
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
        defaultCommissionPercent: num(row.defaultCommissionPercent),
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

    const rate = Number(req.body?.defaultCommissionPercent);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ success: false, message: 'defaultCommissionPercent must be between 0 and 100' });
    }

    row.defaultCommissionPercent = rate;
    row.updatedByUserId = req.user.id;
    await row.save();

    invalidatePlatformDefaultsCache();

    return res.json({ success: true, data: { id: row.id, defaultCommissionPercent: num(row.defaultCommissionPercent) } });
  } catch (error) {
    console.error('Update commission settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update commission settings' });
  }
};

exports.formatAdminPractice = formatAdminPractice;
