'use strict';

const {
  Appointment,
  Department,
  HospitalProfile,
  HospitalStaff,
  HospitalStaffAvailability,
  sequelize
} = require('../models');

function formatStaff(staff) {
  const v = staff.toJSON ? staff.toJSON() : staff;
  return {
    id: v.id,
    hospitalProfileId: v.hospitalProfileId,
    departmentId: v.departmentId || null,
    department: v.department ? {
      id: v.department.id,
      name: v.department.name,
      isActive: !!v.department.isActive
    } : null,
    name: v.name,
    specialization: v.specialization || null,
    qualification: v.qualification || null,
    experienceYears: v.experienceYears === null || v.experienceYears === undefined
      ? null
      : Number(v.experienceYears),
    phone: v.phone || null,
    email: v.email || null,
    bio: v.bio || null,
    avatarUrl: v.avatarUrl || null,
    consultationFee: v.consultationFee === null || v.consultationFee === undefined
      ? null
      : Number(v.consultationFee),
    effectiveConsultationFee: v.effectiveConsultationFee === null || v.effectiveConsultationFee === undefined
      ? null
      : Number(v.effectiveConsultationFee),
    isBookable: !!v.isBookable,
    isActive: !!v.isActive,
    availability: (v.availability || []).map(slot => ({
      id: slot.id,
      dayOfWeek: Number(slot.dayOfWeek),
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: !!slot.isAvailable
    })),
    displayOrder: v.displayOrder || 0,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt
  };
}

function pickStaffFields(body = {}) {
  const out = {};
  if (body.name !== undefined) out.name = String(body.name || '').trim();
  if (body.specialization !== undefined) out.specialization = body.specialization ? String(body.specialization).trim() : null;
  if (body.qualification !== undefined) out.qualification = body.qualification ? String(body.qualification).trim() : null;
  if (body.experienceYears !== undefined) {
    const n = body.experienceYears === null ? null : Number(body.experienceYears);
    if (n !== null && (!Number.isFinite(n) || n < 0 || n > 80)) {
      throw Object.assign(new Error('experienceYears must be between 0 and 80'), { statusCode: 400 });
    }
    out.experienceYears = n;
  }
  if (body.phone !== undefined) out.phone = body.phone ? String(body.phone).trim() : null;
  if (body.email !== undefined) out.email = body.email ? String(body.email).trim() : null;
  if (body.bio !== undefined) out.bio = body.bio ? String(body.bio).trim() : null;
  if (body.avatarUrl !== undefined) out.avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : null;
  if (body.departmentId !== undefined) {
    const n = Number(body.departmentId);
    if (!Number.isInteger(n) || n <= 0) {
      throw Object.assign(new Error('departmentId must be a positive integer'), { statusCode: 400 });
    }
    out.departmentId = n;
  }
  if (body.consultationFee !== undefined) {
    const n = body.consultationFee === null || body.consultationFee === '' ? null : Number(body.consultationFee);
    if (n !== null && (!Number.isFinite(n) || n <= 0)) {
      throw Object.assign(new Error('consultationFee must be greater than zero'), { statusCode: 400 });
    }
    out.consultationFee = n;
  }
  if (body.isBookable !== undefined) out.isBookable = !!body.isBookable;
  if (body.isActive !== undefined) out.isActive = !!body.isActive;
  if (body.displayOrder !== undefined) {
    const n = Number(body.displayOrder);
    out.displayOrder = Number.isFinite(n) ? n : 0;
  }
  return out;
}

function normalizeAvailability(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw Object.assign(new Error('availability must be an array'), { statusCode: 400 });
  }
  const slots = value.map((slot) => {
    const dayOfWeek = Number(slot.dayOfWeek);
    const startTime = String(slot.startTime || '').slice(0, 5);
    const endTime = String(slot.endTime || '').slice(0, 5);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw Object.assign(new Error('Availability day must be between 0 and 6'), { statusCode: 400 });
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime) {
      throw Object.assign(new Error('Availability requires a valid start time before end time'), { statusCode: 400 });
    }
    return { dayOfWeek, startTime, endTime, isAvailable: slot.isAvailable !== false };
  }).filter(slot => slot.isAvailable);

  const ordered = [...slots].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  for (let i = 1; i < ordered.length; i += 1) {
    const previous = ordered[i - 1];
    const current = ordered[i];
    if (previous.dayOfWeek === current.dayOfWeek && current.startTime < previous.endTime) {
      throw Object.assign(new Error('Availability slots cannot overlap'), { statusCode: 400 });
    }
  }
  return slots;
}

function staffIncludes() {
  return [
    { model: Department, as: 'department', required: false },
    { model: HospitalStaffAvailability, as: 'availability', required: false }
  ];
}

async function validateManagedDoctor(hospital, fields, slots, currentStaff, transaction) {
  const departmentId = fields.departmentId ?? currentStaff?.departmentId;
  const isActive = fields.isActive ?? currentStaff?.isActive ?? true;
  const isBookable = fields.isBookable ?? currentStaff?.isBookable ?? false;
  const consultationFee = fields.consultationFee !== undefined
    ? fields.consultationFee
    : currentStaff?.consultationFee;
  const currentSlotCount = currentStaff
    ? await HospitalStaffAvailability.count({ where: { hospitalStaffId: currentStaff.id, isAvailable: true }, transaction })
    : 0;

  if (!departmentId) {
    throw Object.assign(new Error('departmentId is required'), { statusCode: 400 });
  }
  const department = await Department.findOne({
    where: { id: departmentId, hospitalProfileId: hospital.id },
    transaction
  });
  if (!department) {
    throw Object.assign(new Error('Department not found for this hospital'), { statusCode: 400 });
  }
  if (isBookable && (!isActive || !department.isActive)) {
    throw Object.assign(new Error('Only active doctors in active departments can be bookable'), { statusCode: 400 });
  }
  if (isBookable && hospital.consultationFeeMode === 'PER_DOCTOR' && !(Number(consultationFee) > 0)) {
    throw Object.assign(new Error('A consultation fee is required for bookable doctors in Doctor-specific fees mode'), { statusCode: 400 });
  }
  if (isBookable && slots !== undefined && slots.length === 0) {
    throw Object.assign(new Error('At least one availability slot is required for a bookable doctor'), { statusCode: 400 });
  }
  if (isBookable && slots === undefined && currentSlotCount === 0) {
    throw Object.assign(new Error('At least one availability slot is required for a bookable doctor'), { statusCode: 400 });
  }
}

async function loadStaff(id, hospitalProfileId, transaction) {
  return HospitalStaff.findOne({
    where: { id, hospitalProfileId },
    include: staffIncludes(),
    order: [[{ model: HospitalStaffAvailability, as: 'availability' }, 'dayOfWeek', 'ASC']],
    transaction
  });
}

async function requireOwnedHospital(userId) {
  const hospital = await HospitalProfile.findOne({ where: { userId } });
  if (!hospital) {
    const err = new Error('Hospital profile not found');
    err.statusCode = 404;
    throw err;
  }
  return hospital;
}

exports.listStaff = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const staff = await HospitalStaff.findAll({
      where: { hospitalProfileId: hospital.id },
      include: staffIncludes(),
      order: [['displayOrder', 'ASC'], ['id', 'ASC']]
    });
    const data = staff.map((member) => {
      member.setDataValue('effectiveConsultationFee', hospital.consultationFeeMode === 'PER_DOCTOR'
        ? member.consultationFee
        : hospital.defaultConsultationFee);
      return formatStaff(member);
    });
    return res.json({
      success: true,
      data,
      pricing: {
        consultationFeeMode: hospital.consultationFeeMode,
        defaultConsultationFee: Number(hospital.defaultConsultationFee)
      }
    });
  } catch (error) {
    console.error('List hospital staff error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to load staff' });
  }
};

exports.createStaff = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const hospital = await HospitalProfile.findOne({ where: { userId: req.user.id }, transaction });
    if (!hospital) throw Object.assign(new Error('Hospital profile not found'), { statusCode: 404 });
    const fields = pickStaffFields(req.body || {});
    const slots = normalizeAvailability(req.body?.availability) || [];
    if (!fields.name) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    await validateManagedDoctor(hospital, fields, slots, null, transaction);
    const staff = await HospitalStaff.create({
      ...fields,
      hospitalProfileId: hospital.id
    }, { transaction });
    if (slots.length) {
      await HospitalStaffAvailability.bulkCreate(
        slots.map(slot => ({ ...slot, hospitalStaffId: staff.id })),
        { transaction }
      );
    }
    await transaction.commit();
    const created = await loadStaff(staff.id, hospital.id);
    return res.status(201).json({ success: true, data: formatStaff(created) });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('Create hospital staff error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to add staff' });
  }
};

exports.updateStaff = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const hospital = await HospitalProfile.findOne({ where: { userId: req.user.id }, transaction });
    if (!hospital) throw Object.assign(new Error('Hospital profile not found'), { statusCode: 404 });
    const staff = await HospitalStaff.findOne({
      where: { id: req.params.id, hospitalProfileId: hospital.id },
      transaction
    });
    if (!staff) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const fields = pickStaffFields(req.body || {});
    const slots = normalizeAvailability(req.body?.availability);
    if (fields.name === '') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'name cannot be empty' });
    }
    if (fields.isActive === false) fields.isBookable = false;
    await validateManagedDoctor(hospital, fields, slots, staff, transaction);
    Object.assign(staff, fields);
    await staff.save({ transaction });
    if (slots !== undefined) {
      await HospitalStaffAvailability.destroy({ where: { hospitalStaffId: staff.id }, transaction });
      if (slots.length) {
        await HospitalStaffAvailability.bulkCreate(
          slots.map(slot => ({ ...slot, hospitalStaffId: staff.id })),
          { transaction }
        );
      }
    }
    await transaction.commit();
    const updated = await loadStaff(staff.id, hospital.id);
    return res.json({ success: true, data: formatStaff(updated) });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('Update hospital staff error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to update staff' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const staff = await HospitalStaff.findOne({
      where: { id: req.params.id, hospitalProfileId: hospital.id }
    });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    const hasAppointments = await Appointment.count({ where: { hospitalStaffId: staff.id } });
    if (hasAppointments) {
      await staff.update({ isActive: false, isBookable: false });
      return res.json({ success: true, message: 'Doctor deactivated because appointment history exists' });
    }
    await staff.destroy();
    return res.json({ success: true, message: 'Doctor removed' });
  } catch (error) {
    console.error('Delete hospital staff error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to remove staff' });
  }
};

// Public listing consumed by the hospital detail page (staff cards).
exports.publicListStaffForHospital = async (req, res) => {
  try {
    const hospitalProfileId = parseInt(req.params.hospitalId, 10);
    if (!Number.isInteger(hospitalProfileId)) {
      return res.status(400).json({ success: false, message: 'Invalid hospital id' });
    }
    const staff = await HospitalStaff.findAll({
      where: { hospitalProfileId, isActive: true },
      include: [{ model: Department, as: 'department', required: false }],
      order: [['displayOrder', 'ASC'], ['id', 'ASC']]
    });
    return res.json({ success: true, data: staff.map(formatStaff) });
  } catch (error) {
    console.error('Public list staff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load staff' });
  }
};

// POST /api/hospital/staff-avatar — used by the sitting-doctor form to upload
// an avatar image before the staff row exists. Returns a public URL that the
// form embeds in its avatarUrl field on save. Files are stored per-hospital-user
// under uploads/staff-avatars/<userId>/.
exports.uploadStaffAvatar = async (req, res) => {
  try {
    await requireOwnedHospital(req.user.id);
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const url = `/uploads/staff-avatars/${req.user.id}/${file.filename}`;
    return res.json({ success: true, data: { url } });
  } catch (error) {
    console.error('Upload staff avatar error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to upload avatar' });
  }
};

exports.formatStaff = formatStaff;

exports.getHospitalBookingOptions = async (req, res) => {
  try {
    const hospitalProfileId = Number(req.params.hospitalId);
    if (!Number.isInteger(hospitalProfileId) || hospitalProfileId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid hospital id' });
    }
    const hospital = await HospitalProfile.findByPk(hospitalProfileId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    const departments = await Department.findAll({
      where: { hospitalProfileId, isActive: true },
      include: [{
        model: HospitalStaff,
        as: 'doctors',
        where: { isActive: true, isBookable: true },
        required: true,
        include: [{ model: HospitalStaffAvailability, as: 'availability', where: { isAvailable: true }, required: false }]
      }],
      order: [['name', 'ASC'], [{ model: HospitalStaff, as: 'doctors' }, 'displayOrder', 'ASC']]
    });

    const standardFee = Number(hospital.defaultConsultationFee) || 0;
    const feeMode = hospital.consultationFeeMode || 'STANDARD';

    const data = departments
      .map((department) => {
        const doctors = (department.doctors || [])
          .filter(doctor => (doctor.availability || []).length > 0)
          .map(doctor => ({
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization || null,
            qualification: doctor.qualification || null,
            experienceYears: doctor.experienceYears === null || doctor.experienceYears === undefined
              ? null
              : Number(doctor.experienceYears),
            avatarUrl: doctor.avatarUrl || null,
            effectiveConsultationFee: feeMode === 'PER_DOCTOR'
              ? Number(doctor.consultationFee) || 0
              : standardFee,
            availability: (doctor.availability || [])
              .map(slot => ({
                dayOfWeek: Number(slot.dayOfWeek),
                startTime: String(slot.startTime).slice(0, 5),
                endTime: String(slot.endTime).slice(0, 5)
              }))
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
          }));
        return {
          id: department.id,
          name: department.name,
          description: department.description || null,
          doctors
        };
      })
      .filter(department => department.doctors.length > 0);

    return res.json({
      success: true,
      data: {
        hospitalId: hospital.id,
        hospitalName: hospital.hospitalName,
        acceptsBookings: hospital.acceptsBookings !== false,
        consultationFeeMode: feeMode,
        defaultConsultationFee: standardFee,
        departments: data
      }
    });
  } catch (error) {
    console.error('Hospital booking options error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load booking options' });
  }
};
