'use strict';

const {
  DoctorPractice,
  DoctorProfile,
  HospitalProfile,
  User,
  Specialization,
  Appointment,
  DoctorAvailability,
  sequelize
} = require('../models');
const { PRACTICE_STATUSES, COMMISSION_MODES } = require('../models/doctor-practice');
const {
  resolveCommissionMode,
  defaultPercentsForMode,
  getPlatformDefaults
} = require('../utils/practiceCommission');
const { isApprovedStatus } = require('../utils/providerReview');
const { PlatformCommissionSettings } = require('../models');

function toNumber(v, fallback = null) {
  if (v === null || v === undefined || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : fallback;
}

function formatPractice(practice) {
  const value = practice.toJSON ? practice.toJSON() : practice;
  return {
    id: value.id,
    doctorProfileId: value.doctorProfileId,
    hospitalProfileId: value.hospitalProfileId,
    consultationFee: toNumber(value.consultationFee, 0),
    isPrimary: !!value.isPrimary,
    isActive: !!value.isActive,
    status: value.status,
    commissionMode: value.commissionMode,
    platformCommissionPercent: toNumber(value.platformCommissionPercent, 0),
    hospitalPayoutPercent: toNumber(value.hospitalPayoutPercent, 0),
    doctorPayoutPercent: toNumber(value.doctorPayoutPercent, 0),
    commissionOverridden: !!value.commissionOverridden,
    notes: value.notes || null,
    hospital: value.hospital ? {
      id: value.hospital.id,
      hospitalName: value.hospital.hospitalName,
      hospitalKind: value.hospital.hospitalKind,
      hospitalCity: value.hospital.hospitalCity,
      hospitalState: value.hospital.hospitalState
    } : null,
    doctor: value.doctor ? {
      id: value.doctor.id,
      registrationNumber: value.doctor.registrationNumber,
      qualification: value.doctor.qualification,
      user: value.doctor.user ? { id: value.doctor.user.id, name: value.doctor.user.name } : null,
      specialization: value.doctor.specialization ? { id: value.doctor.specialization.id, name: value.doctor.specialization.name } : null
    } : null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

// Public: list active/approved practices for a doctor (booking UI needs this).
exports.listPublicPracticesForDoctor = async (req, res) => {
  try {
    const doctorProfileId = parseInt(req.params.doctorId, 10);
    if (!Number.isInteger(doctorProfileId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor id' });
    }

    const practices = await DoctorPractice.findAll({
      where: {
        doctorProfileId,
        isActive: true,
        status: PRACTICE_STATUSES.ACTIVE
      },
      include: [{
        model: HospitalProfile,
        as: 'hospital',
        attributes: ['id', 'hospitalName', 'hospitalKind', 'hospitalCity', 'hospitalState', 'verificationStatus']
      }],
      order: [['isPrimary', 'DESC'], ['id', 'ASC']]
    });

    const publishable = practices.filter(p => p.hospital && isApprovedStatus(p.hospital.verificationStatus));
    return res.json({
      success: true,
      data: publishable.map(formatPractice)
    });
  } catch (error) {
    console.error('List public practices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load practices' });
  }
};

// Doctor self-service: list own practices (any status).
exports.listMyPractices = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const practices = await DoctorPractice.findAll({
      where: { doctorProfileId: doctor.id },
      include: [{
        model: HospitalProfile,
        as: 'hospital',
        attributes: ['id', 'hospitalName', 'hospitalKind', 'hospitalCity', 'hospitalState']
      }],
      order: [['isPrimary', 'DESC'], ['id', 'ASC']]
    });
    return res.json({ success: true, data: practices.map(formatPractice) });
  } catch (error) {
    console.error('List my practices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load practices' });
  }
};

// Doctor self-service: onboard as a solo practitioner. Creates the doctor's
// own solo_practice HospitalProfile (verified/approved so it's usable
// immediately) and a primary active DoctorPractice at single-commission mode
// in one transaction. Refuses if the doctor already owns a hospital.
exports.createSoloClinic = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const doctor = await DoctorProfile.findOne({ where: { userId: req.user.id }, transaction: t });
    if (!doctor) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const existingOwned = await HospitalProfile.findOne({
      where: { userId: req.user.id },
      transaction: t
    });
    if (existingOwned) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'You already own a hospital profile. Use the Add Practice flow to link it.'
      });
    }

    const {
      hospitalName,
      consultationFee,
      hospitalPhone,
      hospitalEmail,
      hospitalAddress,
      hospitalCity,
      hospitalState,
      hospitalPincode
    } = req.body || {};

    const name = String(hospitalName || '').trim();
    if (!name) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'hospitalName is required' });
    }
    const fee = toNumber(consultationFee, null);
    if (fee === null || fee < 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'consultationFee must be >= 0' });
    }

    const user = await User.findByPk(req.user.id, { transaction: t });

    const hospital = await HospitalProfile.create({
      userId: req.user.id,
      hospitalName: name,
      hospitalEmail: (hospitalEmail && String(hospitalEmail).trim()) || user?.email || null,
      hospitalPhone: (hospitalPhone && String(hospitalPhone).trim()) || user?.phone || null,
      hospitalAddress: hospitalAddress ? String(hospitalAddress).trim() : null,
      hospitalCity: hospitalCity ? String(hospitalCity).trim() : null,
      hospitalState: hospitalState ? String(hospitalState).trim() : null,
      hospitalPincode: hospitalPincode ? String(hospitalPincode).trim() : null,
      hospitalKind: 'solo_practice',
      verificationStatus: 'approved',
      specialtyIds: []
    }, { transaction: t });

    const defaults = await getPlatformDefaults({ PlatformCommissionSettings });
    const percents = defaultPercentsForMode(COMMISSION_MODES.SINGLE, defaults);

    const anyPrimary = await DoctorPractice.count({
      where: { doctorProfileId: doctor.id, isPrimary: true },
      transaction: t
    });

    const practice = await DoctorPractice.create({
      doctorProfileId: doctor.id,
      hospitalProfileId: hospital.id,
      consultationFee: fee,
      isPrimary: anyPrimary === 0,
      isActive: true,
      status: PRACTICE_STATUSES.ACTIVE,
      commissionMode: COMMISSION_MODES.SINGLE,
      platformCommissionPercent: percents.platform,
      hospitalPayoutPercent: percents.hospital,
      doctorPayoutPercent: percents.doctor,
      commissionOverridden: false,
      notes: null
    }, { transaction: t });

    await t.commit();

    const created = await DoctorPractice.findByPk(practice.id, {
      include: [{ model: HospitalProfile, as: 'hospital' }]
    });
    return res.status(201).json({ success: true, data: formatPractice(created) });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Create solo clinic error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create solo clinic' });
  }
};

// Doctor self-service: request affiliation with a hospital.
exports.createPracticeRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const doctor = await DoctorProfile.findOne({ where: { userId: req.user.id }, transaction: t });
    if (!doctor) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const { hospitalProfileId, consultationFee, notes } = req.body || {};
    const hospId = parseInt(hospitalProfileId, 10);
    const fee = toNumber(consultationFee, null);
    if (!Number.isInteger(hospId)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'hospitalProfileId is required' });
    }
    if (fee === null || fee < 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'consultationFee must be >= 0' });
    }

    const hospital = await HospitalProfile.findByPk(hospId, { transaction: t });
    if (!hospital) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const existing = await DoctorPractice.findOne({
      where: { doctorProfileId: doctor.id, hospitalProfileId: hospId },
      transaction: t
    });
    if (existing) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'Practice already exists for this doctor + hospital' });
    }

    const mode = resolveCommissionMode({ hospitalProfile: hospital, doctorProfile: doctor });
    const defaults = await getPlatformDefaults({ PlatformCommissionSettings });
    const percents = defaultPercentsForMode(mode, defaults);

    const anyPrimary = await DoctorPractice.count({
      where: { doctorProfileId: doctor.id, isPrimary: true },
      transaction: t
    });

    // Self-owned hospital → auto-approve; otherwise, hospital owner must approve.
    const selfOwned = mode === COMMISSION_MODES.SINGLE;
    const status = selfOwned ? PRACTICE_STATUSES.ACTIVE : PRACTICE_STATUSES.PENDING_HOSPITAL_APPROVAL;

    const practice = await DoctorPractice.create({
      doctorProfileId: doctor.id,
      hospitalProfileId: hospId,
      consultationFee: fee,
      isPrimary: anyPrimary === 0,
      isActive: selfOwned,
      status,
      commissionMode: mode,
      platformCommissionPercent: percents.platform,
      hospitalPayoutPercent: percents.hospital,
      doctorPayoutPercent: percents.doctor,
      commissionOverridden: false,
      notes: notes ? String(notes).trim() : null
    }, { transaction: t });

    await t.commit();
    const created = await DoctorPractice.findByPk(practice.id, {
      include: [{ model: HospitalProfile, as: 'hospital' }]
    });
    return res.status(201).json({ success: true, data: formatPractice(created) });
  } catch (error) {
    await t.rollback();
    console.error('Create practice request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create practice request' });
  }
};

// Doctor self-service: update own practice (fee/notes only; commission percents are admin-only).
exports.updateMyPractice = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const practice = await DoctorPractice.findOne({
      where: { id: req.params.id, doctorProfileId: doctor.id }
    });
    if (!practice) return res.status(404).json({ success: false, message: 'Practice not found' });

    const { consultationFee, notes, isPrimary } = req.body || {};
    if (consultationFee !== undefined) {
      const fee = toNumber(consultationFee, null);
      if (fee === null || fee < 0) {
        return res.status(400).json({ success: false, message: 'consultationFee must be >= 0' });
      }
      practice.consultationFee = fee;
    }
    if (notes !== undefined) practice.notes = notes ? String(notes).trim() : null;

    if (isPrimary === true && !practice.isPrimary) {
      await sequelize.transaction(async (t) => {
        await DoctorPractice.update(
          { isPrimary: false },
          { where: { doctorProfileId: doctor.id, isPrimary: true }, transaction: t }
        );
        practice.isPrimary = true;
        await practice.save({ transaction: t });
      });
    } else {
      await practice.save();
    }

    const updated = await DoctorPractice.findByPk(practice.id, {
      include: [{ model: HospitalProfile, as: 'hospital' }]
    });
    return res.json({ success: true, data: formatPractice(updated) });
  } catch (error) {
    console.error('Update my practice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update practice' });
  }
};

// Doctor self-service: deactivate own practice (soft delete).
exports.deactivateMyPractice = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const practice = await DoctorPractice.findOne({
      where: { id: req.params.id, doctorProfileId: doctor.id }
    });
    if (!practice) return res.status(404).json({ success: false, message: 'Practice not found' });

    if (practice.isPrimary) {
      return res.status(409).json({
        success: false,
        message: 'Cannot deactivate primary practice. Mark another practice as primary first.'
      });
    }

    practice.isActive = false;
    practice.status = PRACTICE_STATUSES.INACTIVE;
    await practice.save();
    return res.json({ success: true, message: 'Practice deactivated' });
  } catch (error) {
    console.error('Deactivate practice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to deactivate practice' });
  }
};

// Hospital owner: list pending affiliation requests for own hospital.
exports.listHospitalPractices = async (req, res) => {
  try {
    const hospital = await HospitalProfile.findOne({ where: { userId: req.user.id } });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital profile not found' });

    const { status } = req.query;
    const where = { hospitalProfileId: hospital.id };
    if (status && Object.values(PRACTICE_STATUSES).includes(status)) where.status = status;

    const practices = await DoctorPractice.findAll({
      where,
      include: [{
        model: DoctorProfile,
        as: 'doctor',
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: Specialization, as: 'specialization', attributes: ['id', 'name'] }
        ]
      }],
      order: [['status', 'ASC'], ['createdAt', 'DESC']]
    });
    return res.json({ success: true, data: practices.map(formatPractice) });
  } catch (error) {
    console.error('List hospital practices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load hospital practices' });
  }
};

// Hospital owner: approve/reject a doctor's affiliation request.
exports.reviewPractice = async (req, res) => {
  try {
    const hospital = await HospitalProfile.findOne({ where: { userId: req.user.id } });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital profile not found' });

    const { action, reason } = req.body || {};
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be "approve" or "reject"' });
    }

    const practice = await DoctorPractice.findOne({
      where: { id: req.params.id, hospitalProfileId: hospital.id }
    });
    if (!practice) return res.status(404).json({ success: false, message: 'Practice not found' });
    if (practice.status !== PRACTICE_STATUSES.PENDING_HOSPITAL_APPROVAL) {
      return res.status(409).json({ success: false, message: 'Practice is not pending approval' });
    }

    if (action === 'approve') {
      practice.status = PRACTICE_STATUSES.ACTIVE;
      practice.isActive = true;
    } else {
      practice.status = PRACTICE_STATUSES.REJECTED;
      practice.isActive = false;
      practice.notes = reason ? String(reason).trim() : practice.notes;
    }
    await practice.save();
    return res.json({ success: true, data: formatPractice(practice) });
  } catch (error) {
    console.error('Review practice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to review practice' });
  }
};

exports.formatPractice = formatPractice;

function formatAvailabilitySlot(slot) {
  return {
    id: slot.id,
    dayOfWeek: slot.day_of_week,
    startTime: String(slot.start_time).slice(0, 5),
    endTime: String(slot.end_time).slice(0, 5),
    isAvailable: slot.is_available
  };
}

function validateSlots(payload) {
  if (!Array.isArray(payload)) {
    throw Object.assign(new Error('Availability must be an array'), { statusCode: 400 });
  }
  const slots = payload
    .filter(s => s && s.isAvailable !== false)
    .map(s => ({
      dayOfWeek: Number(s.dayOfWeek),
      startTime: String(s.startTime || '').slice(0, 5),
      endTime: String(s.endTime || '').slice(0, 5)
    }));
  const days = slots.map(s => s.dayOfWeek);
  if (slots.some(s => !Number.isInteger(s.dayOfWeek) || s.dayOfWeek < 0 || s.dayOfWeek > 6)) {
    throw Object.assign(new Error('Availability day must be between Sunday and Saturday'), { statusCode: 400 });
  }
  if (new Set(days).size !== days.length) {
    throw Object.assign(new Error('Only one availability slot is allowed per day'), { statusCode: 400 });
  }
  if (slots.some(s => !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.endTime))) {
    throw Object.assign(new Error('Availability times must use HH:mm format'), { statusCode: 400 });
  }
  if (slots.some(s => s.startTime >= s.endTime)) {
    throw Object.assign(new Error('Availability end time must be after start time'), { statusCode: 400 });
  }
  return slots;
}

exports.getMyPracticeAvailability = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ where: { userId: req.user.id } });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    const practice = await DoctorPractice.findOne({
      where: { id: req.params.practiceId, doctorProfileId: doctor.id }
    });
    if (!practice) return res.status(404).json({ success: false, message: 'Practice not found' });

    const rows = await DoctorAvailability.findAll({
      where: { practice_id: practice.id },
      order: [['day_of_week', 'ASC']]
    });
    return res.json({ success: true, data: rows.map(formatAvailabilitySlot) });
  } catch (error) {
    console.error('Get practice availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load availability' });
  }
};

exports.replaceMyPracticeAvailability = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const doctor = await DoctorProfile.findOne({ where: { userId: req.user.id }, transaction: t });
    if (!doctor) { await t.rollback(); return res.status(404).json({ success: false, message: 'Doctor profile not found' }); }
    const practice = await DoctorPractice.findOne({
      where: { id: req.params.practiceId, doctorProfileId: doctor.id },
      transaction: t
    });
    if (!practice) { await t.rollback(); return res.status(404).json({ success: false, message: 'Practice not found' }); }

    let slots;
    try { slots = validateSlots(req.body?.availability || []); }
    catch (err) { await t.rollback(); return res.status(err.statusCode || 400).json({ success: false, message: err.message }); }

    await DoctorAvailability.destroy({ where: { practice_id: practice.id }, transaction: t });
    if (slots.length) {
      await DoctorAvailability.bulkCreate(slots.map(s => ({
        doctor_profile_id: doctor.id,
        practice_id: practice.id,
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
        is_available: true
      })), { transaction: t });
    }
    await t.commit();

    const refreshed = await DoctorAvailability.findAll({
      where: { practice_id: practice.id },
      order: [['day_of_week', 'ASC']]
    });
    return res.json({ success: true, data: refreshed.map(formatAvailabilitySlot) });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Replace practice availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save availability' });
  }
};

// Public: availability for a specific practice (used by the booking picker).
exports.getPublicPracticeAvailability = async (req, res) => {
  try {
    const practice = await DoctorPractice.findByPk(req.params.practiceId);
    if (!practice || practice.status !== PRACTICE_STATUSES.ACTIVE || !practice.isActive) {
      return res.status(404).json({ success: false, message: 'Practice not available' });
    }
    const rows = await DoctorAvailability.findAll({
      where: { practice_id: practice.id, is_available: true },
      order: [['day_of_week', 'ASC']]
    });
    return res.json({ success: true, data: rows.map(formatAvailabilitySlot) });
  } catch (error) {
    console.error('Public practice availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load availability' });
  }
};

// Hospital owner dashboard summary — appointment counts + payout totals.
exports.getHospitalSummary = async (req, res) => {
  try {
    const hospital = await HospitalProfile.findOne({ where: { userId: req.user.id } });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital profile not found' });

    const appointments = await Appointment.findAll({
      where: { hospitalProfileId: hospital.id },
      include: [{
        model: DoctorProfile,
        as: 'doctorProfile',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
      }],
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
    });

    const totals = {
      totalAppointments: 0,
      completedAppointments: 0,
      upcomingAppointments: 0,
      grossRevenue: 0,
      hospitalPayout: 0,
      doctorPayout: 0,
      platformCommission: 0
    };
    const perDoctor = new Map();
    const todayStr = new Date().toISOString().slice(0, 10);
    const num = (v) => (v !== null && v !== undefined) ? parseFloat(v) : 0;

    for (const appt of appointments) {
      const row = appt.toJSON();
      totals.totalAppointments++;

      const isEarning = ['confirmed', 'completed'].includes(row.status);
      if (isEarning) {
        totals.completedAppointments += row.status === 'completed' ? 1 : 0;
        totals.grossRevenue += num(row.finalPrice);
        totals.hospitalPayout += num(row.hospitalPayoutAmount);
        totals.doctorPayout += num(row.doctorPayoutAmount);
        totals.platformCommission += num(row.platformRevenueAmount);
      }

      const dateStr = typeof row.appointmentDate === 'string'
        ? row.appointmentDate.slice(0, 10)
        : new Date(row.appointmentDate).toISOString().slice(0, 10);
      if (dateStr >= todayStr && ['pending', 'confirmed'].includes(row.status)) {
        totals.upcomingAppointments++;
      }

      const docKey = row.doctorProfileId;
      if (!perDoctor.has(docKey)) {
        perDoctor.set(docKey, {
          doctorProfileId: docKey,
          doctorName: row.doctorProfile?.user?.name || `Doctor #${docKey}`,
          appointmentCount: 0,
          hospitalPayout: 0
        });
      }
      const bucket = perDoctor.get(docKey);
      bucket.appointmentCount++;
      if (isEarning) bucket.hospitalPayout += num(row.hospitalPayoutAmount);
    }

    const round2 = (n) => Math.round(n * 100) / 100;
    Object.keys(totals).forEach(k => { if (typeof totals[k] === 'number') totals[k] = round2(totals[k]); });
    const perDoctorArr = Array.from(perDoctor.values())
      .map(d => ({ ...d, hospitalPayout: round2(d.hospitalPayout) }))
      .sort((a, b) => b.hospitalPayout - a.hospitalPayout);

    return res.json({ success: true, data: { totals, perDoctor: perDoctorArr } });
  } catch (error) {
    console.error('Hospital summary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load hospital summary' });
  }
};
