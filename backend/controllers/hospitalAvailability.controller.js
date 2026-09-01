'use strict';

const { HospitalProfile, HospitalAvailability, sequelize } = require('../models');
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

async function requireOwnedHospital(userId) {
  const hospital = await HospitalProfile.findOne({ where: { userId } });
  if (!hospital) {
    const err = new Error('Hospital profile not found');
    err.statusCode = 404;
    throw err;
  }
  return hospital;
}

function formatSlot(slot) {
  const v = slot.toJSON ? slot.toJSON() : slot;
  return {
    id: v.id,
    dayOfWeek: v.dayOfWeek,
    startTime: String(v.startTime || v.start_time || '').slice(0, 5),
    endTime: String(v.endTime || v.end_time || '').slice(0, 5),
    isAvailable: !!(v.isAvailable ?? v.is_available)
  };
}

function validateAvailabilityPayload(payload) {
  if (!Array.isArray(payload)) {
    throw Object.assign(new Error('availability must be an array'), { statusCode: 400 });
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
    throw Object.assign(new Error('dayOfWeek must be between 0 (Sun) and 6 (Sat)'), { statusCode: 400 });
  }
  if (new Set(days).size !== days.length) {
    throw Object.assign(new Error('Only one slot per day is allowed'), { statusCode: 400 });
  }
  if (slots.some(s => !TIME_PATTERN.test(s.startTime) || !TIME_PATTERN.test(s.endTime))) {
    throw Object.assign(new Error('start_time and end_time must be HH:mm'), { statusCode: 400 });
  }
  if (slots.some(s => s.startTime >= s.endTime)) {
    throw Object.assign(new Error('end_time must be after start_time'), { statusCode: 400 });
  }
  return slots;
}

exports.getMyAvailability = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const rows = await HospitalAvailability.findAll({
      where: { hospitalProfileId: hospital.id },
      order: [['dayOfWeek', 'ASC']]
    });
    return res.json({
      success: true,
      data: {
        acceptsBookings: hospital.acceptsBookings !== false,
        version: hospital.availabilityVersion || 0,
        slots: rows.map(formatSlot)
      }
    });
  } catch (error) {
    console.error('Get hospital availability error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to load availability' });
  }
};

async function currentSnapshot(hospital) {
  const rows = await HospitalAvailability.findAll({
    where: { hospitalProfileId: hospital.id },
    order: [['dayOfWeek', 'ASC']]
  });
  return {
    acceptsBookings: hospital.acceptsBookings !== false,
    version: hospital.availabilityVersion || 0,
    slots: rows.map(formatSlot)
  };
}

// Full replace: whatever the client sends is the new schedule. expectedVersion
// (optional) triggers an optimistic-concurrency check.
exports.replaceMyAvailability = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const hospital = await requireOwnedHospital(req.user.id);

    if (req.body?.expectedVersion !== undefined && req.body?.expectedVersion !== null) {
      const expected = Number(req.body.expectedVersion);
      if (!Number.isInteger(expected) || expected < 0) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'expectedVersion must be a non-negative integer' });
      }
      if (expected !== (hospital.availabilityVersion || 0)) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          code: 'STALE_AVAILABILITY',
          message: 'Someone else updated hospital hours since you loaded the page. Showing the latest settings.',
          currentData: await currentSnapshot(hospital)
        });
      }
    }

    const slots = validateAvailabilityPayload(req.body?.availability);
    await HospitalAvailability.destroy({
      where: { hospitalProfileId: hospital.id },
      transaction: t
    });
    if (slots.length) {
      await HospitalAvailability.bulkCreate(
        slots.map(s => ({
          hospitalProfileId: hospital.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime + ':00',
          endTime: s.endTime + ':00',
          isAvailable: true
        })),
        { transaction: t }
      );
    }
    hospital.availabilityVersion = (hospital.availabilityVersion || 0) + 1;
    await hospital.save({ transaction: t });
    await t.commit();
    return res.json({ success: true, data: await currentSnapshot(hospital) });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Replace hospital availability error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to update availability' });
  }
};

exports.getPublicAvailability = async (req, res) => {
  try {
    const hospitalProfileId = parseInt(req.params.hospitalId, 10);
    if (!Number.isInteger(hospitalProfileId)) {
      return res.status(400).json({ success: false, message: 'Invalid hospital id' });
    }
    const hospital = await HospitalProfile.findByPk(hospitalProfileId, {
      attributes: ['id', 'acceptsBookings']
    });
    const rows = await HospitalAvailability.findAll({
      where: { hospitalProfileId, isAvailable: true },
      order: [['dayOfWeek', 'ASC']]
    });
    return res.json({
      success: true,
      data: {
        acceptsBookings: hospital ? hospital.acceptsBookings !== false : true,
        slots: rows.map(formatSlot)
      }
    });
  } catch (error) {
    console.error('Public hospital availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load availability' });
  }
};

exports.setAcceptsBookings = async (req, res) => {
  try {
    const hospital = await requireOwnedHospital(req.user.id);
    const value = req.body?.acceptsBookings;
    if (typeof value !== 'boolean') {
      return res.status(400).json({ success: false, message: 'acceptsBookings must be true or false' });
    }
    if (req.body?.expectedVersion !== undefined && req.body?.expectedVersion !== null) {
      const expected = Number(req.body.expectedVersion);
      if (!Number.isInteger(expected) || expected < 0) {
        return res.status(400).json({ success: false, message: 'expectedVersion must be a non-negative integer' });
      }
      if (expected !== (hospital.availabilityVersion || 0)) {
        return res.status(409).json({
          success: false,
          code: 'STALE_AVAILABILITY',
          message: 'Someone else updated hospital hours since you loaded the page. Showing the latest settings.',
          currentData: await currentSnapshot(hospital)
        });
      }
    }
    hospital.acceptsBookings = value;
    hospital.availabilityVersion = (hospital.availabilityVersion || 0) + 1;
    await hospital.save();
    return res.json({
      success: true,
      data: {
        acceptsBookings: hospital.acceptsBookings,
        version: hospital.availabilityVersion
      }
    });
  } catch (error) {
    console.error('Set accepts_bookings error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to update' });
  }
};
