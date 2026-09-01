'use strict';

const { HospitalProfile, HospitalStaff } = require('../models');

function formatStaff(staff) {
  const v = staff.toJSON ? staff.toJSON() : staff;
  return {
    id: v.id,
    hospitalProfileId: v.hospitalProfileId,
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
    isActive: !!v.isActive,
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
  if (body.isActive !== undefined) out.isActive = !!body.isActive;
  if (body.displayOrder !== undefined) {
    const n = Number(body.displayOrder);
    out.displayOrder = Number.isFinite(n) ? n : 0;
  }
  return out;
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
      order: [['displayOrder', 'ASC'], ['id', 'ASC']]
    });
    return res.json({ success: true, data: staff.map(formatStaff) });
  } catch (error) {
    console.error('List hospital staff error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to load staff' });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const fields = pickStaffFields(req.body || {});
    if (!fields.name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    const staff = await HospitalStaff.create({
      ...fields,
      hospitalProfileId: hospital.id
    });
    return res.status(201).json({ success: true, data: formatStaff(staff) });
  } catch (error) {
    console.error('Create hospital staff error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to add staff' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const staff = await HospitalStaff.findOne({
      where: { id: req.params.id, hospitalProfileId: hospital.id }
    });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    const fields = pickStaffFields(req.body || {});
    if (fields.name === '') {
      return res.status(400).json({ success: false, message: 'name cannot be empty' });
    }
    Object.assign(staff, fields);
    await staff.save();
    return res.json({ success: true, data: formatStaff(staff) });
  } catch (error) {
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
    await staff.destroy();
    return res.json({ success: true, message: 'Staff removed' });
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
