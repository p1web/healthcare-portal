'use strict';

const { Department, HospitalProfile, HospitalStaff } = require('../models');

function formatDepartment(department) {
  const value = department.toJSON ? department.toJSON() : department;
  return {
    id: value.id,
    hospitalProfileId: value.hospitalProfileId,
    name: value.name,
    description: value.description || null,
    isActive: !!value.isActive,
    doctorCount: Number(value.doctorCount || 0),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

async function requireOwnedHospital(userId) {
  const hospital = await HospitalProfile.findOne({ where: { userId } });
  if (!hospital) {
    throw Object.assign(new Error('Hospital profile not found'), { statusCode: 404 });
  }
  return hospital;
}

function departmentFields(body = {}) {
  const fields = {};
  if (body.name !== undefined) fields.name = String(body.name || '').trim();
  if (body.description !== undefined) {
    fields.description = body.description ? String(body.description).trim() : null;
  }
  if (body.isActive !== undefined) fields.isActive = !!body.isActive;
  return fields;
}

async function ensureUniqueName(hospitalProfileId, name, excludeId) {
  const departments = await Department.findAll({ where: { hospitalProfileId } });
  const duplicate = departments.some(department => (
    department.id !== excludeId && department.name.trim().toLowerCase() === name.toLowerCase()
  ));
  if (duplicate) {
    throw Object.assign(new Error('A department with this name already exists'), { statusCode: 409 });
  }
}

exports.listMine = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const departments = await Department.findAll({
      where: { hospitalProfileId: hospital.id },
      include: [{ model: HospitalStaff, as: 'doctors', attributes: ['id'], required: false }],
      order: [['name', 'ASC']]
    });
    return res.json({
      success: true,
      data: departments.map((department) => {
        department.setDataValue('doctorCount', department.doctors?.length || 0);
        return formatDepartment(department);
      })
    });
  } catch (error) {
    console.error('List departments error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to load departments' });
  }
};

exports.create = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const fields = departmentFields(req.body);
    if (!fields.name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }
    if (fields.name.length > 255) {
      return res.status(400).json({ success: false, message: 'Department name cannot exceed 255 characters' });
    }
    await ensureUniqueName(hospital.id, fields.name);
    const department = await Department.create({ ...fields, hospitalProfileId: hospital.id });
    return res.status(201).json({ success: true, data: formatDepartment(department) });
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to create department' });
  }
};

exports.update = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const department = await Department.findOne({
      where: { id: req.params.id, hospitalProfileId: hospital.id }
    });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    const fields = departmentFields(req.body);
    if (fields.name === '') {
      return res.status(400).json({ success: false, message: 'Department name cannot be empty' });
    }
    if (fields.name?.length > 255) {
      return res.status(400).json({ success: false, message: 'Department name cannot exceed 255 characters' });
    }
    if (fields.name) await ensureUniqueName(hospital.id, fields.name, department.id);
    if (fields.isActive === false) {
      const activeDoctors = await HospitalStaff.count({
        where: { departmentId: department.id, isActive: true }
      });
      if (activeDoctors > 0) {
        return res.status(409).json({
          success: false,
          message: 'Move or deactivate active doctors before deactivating this department'
        });
      }
    }
    await department.update(fields);
    return res.json({ success: true, data: formatDepartment(department) });
  } catch (error) {
    console.error('Update department error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to update department' });
  }
};

exports.remove = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const department = await Department.findOne({
      where: { id: req.params.id, hospitalProfileId: hospital.id }
    });
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    const doctorCount = await HospitalStaff.count({ where: { departmentId: department.id } });
    if (doctorCount > 0) {
      await department.update({ isActive: false });
      return res.json({ success: true, message: 'Department deactivated because doctor history exists' });
    }
    await department.destroy();
    return res.json({ success: true, message: 'Department removed' });
  } catch (error) {
    console.error('Remove department error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to remove department' });
  }
};

exports.listPublic = async (req, res) => {
  try {
    const hospitalProfileId = Number(req.params.hospitalId);
    if (!Number.isInteger(hospitalProfileId) || hospitalProfileId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid hospital id' });
    }
    const departments = await Department.findAll({
      where: { hospitalProfileId, isActive: true },
      include: [{
        model: HospitalStaff,
        as: 'doctors',
        attributes: ['id'],
        where: { isActive: true, isBookable: true },
        required: true
      }],
      order: [['name', 'ASC']]
    });
    return res.json({
      success: true,
      data: departments.map((department) => {
        department.setDataValue('doctorCount', department.doctors?.length || 0);
        return formatDepartment(department);
      })
    });
  } catch (error) {
    console.error('Public departments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load departments' });
  }
};
