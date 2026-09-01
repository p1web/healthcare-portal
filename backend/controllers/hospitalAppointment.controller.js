'use strict';

const { Op } = require('sequelize');
const {
  Appointment,
  DoctorProfile,
  HospitalProfile,
  Specialization,
  User
} = require('../models');

const doctorInclude = {
  model: DoctorProfile,
  as: 'doctorProfile',
  include: [
    { model: User, as: 'user', attributes: ['id', 'name'] },
    { model: Specialization, as: 'specialization', attributes: ['id', 'name'] }
  ]
};

const patientInclude = {
  model: User,
  as: 'patient',
  attributes: ['id', 'name', 'email', 'phone']
};

// Returns the scheduled start as a local-time Date, or null if the row has no
// usable appointment_date. Falls back to 00:00 when appointment_time is null.
function getAppointmentStart(appointment) {
  const date = appointment.appointmentDate;
  if (!date) return null;
  const rawTime = appointment.appointmentTime || '00:00';
  const time = String(rawTime).length >= 5 ? String(rawTime).slice(0, 5) : '00:00';
  const start = new Date(`${date}T${time}:00`);
  return Number.isNaN(start.getTime()) ? null : start;
}

function num(v) { return (v === null || v === undefined) ? 0 : parseFloat(v); }

function formatHospitalAppointment(a) {
  const v = a.toJSON ? a.toJSON() : a;
  return {
    id: v.id,
    bookingNumber: v.bookingNumber || null,
    patientId: v.patientId,
    patientName: v.patient?.name || v.patientName,
    patientEmail: v.patient?.email || v.email,
    patientPhone: v.patient?.phone || v.phone,
    doctorProfileId: v.doctorProfileId || null,
    doctorName: v.doctorProfile?.user?.name || null,
    specialization: v.doctorProfile?.specialization?.name || null,
    isHospitalBooking: !v.doctorProfileId,
    date: v.appointmentDate,
    time: v.appointmentTime,
    reason: v.reason || null,
    status: v.status,
    rejectionReason: v.rejectionReason || null,
    originalPrice: v.originalPrice !== null ? parseFloat(v.originalPrice) : null,
    discountAmount: num(v.discountAmount),
    netCostAfterCashback: v.finalPrice !== null ? parseFloat(v.finalPrice) : null,
    platformRevenueAmount: num(v.platformRevenueAmount),
    doctorPayoutAmount: num(v.doctorPayoutAmount),
    paymentMode: v.paymentMode || 'offline',
    paymentStatus: v.paymentStatus || 'pending',
    paidAt: v.paidAt || null,
    paymentTransactionId: v.paymentTransactionId || null,
    couponCode: v.couponCode || null,
    cashbackAmount: num(v.discountAmount),
    cashbackStatus: v.cashbackStatus || 'none',
    cashbackIssuedAt: v.cashbackIssuedAt || null,
    cashbackTransactionId: v.cashbackTransactionId || null,
    createdAt: v.createdAt
  };
}

async function requireHospital(userId) {
  const hospital = await HospitalProfile.findOne({ where: { userId } });
  if (!hospital) {
    const err = new Error('Hospital profile not found');
    err.statusCode = 404;
    throw err;
  }
  return hospital;
}

exports.listAppointments = async (req, res) => {
  try {
    const hospital = await requireHospital(req.user.id);
    const { status, fromDate, toDate } = req.query;
    const where = { hospitalProfileId: hospital.id };
    if (status && ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'].includes(status)) {
      where.status = status;
    }
    if (fromDate || toDate) {
      where.appointmentDate = {};
      if (fromDate) where.appointmentDate[Op.gte] = fromDate;
      if (toDate) where.appointmentDate[Op.lte] = toDate;
    }
    const appointments = await Appointment.findAll({
      where,
      include: [doctorInclude, patientInclude],
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
    });
    return res.json({ success: true, data: appointments.map(formatHospitalAppointment) });
  } catch (error) {
    console.error('Hospital list appointments error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to load appointments' });
  }
};

exports.confirmAppointment = async (req, res) => {
  try {
    const hospital = await requireHospital(req.user.id);
    const appointment = await Appointment.findOne({
      where: { id: req.params.id, hospitalProfileId: hospital.id },
      include: [doctorInclude, patientInclude]
    });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Appointment is already ${appointment.status}` });
    }
    appointment.status = 'confirmed';
    await appointment.save();
    return res.json({
      success: true,
      message: 'Appointment confirmed.',
      data: formatHospitalAppointment(appointment)
    });
  } catch (error) {
    console.error('Hospital confirm appointment error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to confirm appointment' });
  }
};

exports.completeAppointment = async (req, res) => {
  try {
    const hospital = await requireHospital(req.user.id);
    const appointment = await Appointment.findOne({
      where: { id: req.params.id, hospitalProfileId: hospital.id },
      include: [doctorInclude, patientInclude]
    });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.status !== 'confirmed') {
      return res.status(409).json({ success: false, message: 'Only confirmed appointments can be marked complete' });
    }
    const scheduledStart = getAppointmentStart(appointment);
    if (scheduledStart && Date.now() < scheduledStart.getTime()) {
      return res.status(409).json({
        success: false,
        message: `Appointment cannot be marked complete before its scheduled start (${appointment.appointmentDate}${appointment.appointmentTime ? ' ' + appointment.appointmentTime.slice(0, 5) : ''}).`
      });
    }
    // Same rule as doctor's /complete: online must be paid; offline auto-flips.
    if (appointment.paymentStatus !== 'paid') {
      if (appointment.paymentMode === 'offline') {
        appointment.paymentStatus = 'paid';
        appointment.paidAt = new Date();
        appointment.paymentTransactionId = 'COLLECTED-AT-DESK-' + require('crypto').randomBytes(6).toString('hex').toUpperCase();
      } else {
        return res.status(409).json({
          success: false,
          message: 'Appointment is not paid yet. Ask the patient to complete payment before marking complete.'
        });
      }
    }
    appointment.status = 'completed';
    if (appointment.cashbackStatus === 'pending' && parseFloat(appointment.discountAmount) > 0) {
      appointment.cashbackStatus = 'issued';
      appointment.cashbackIssuedAt = new Date();
      appointment.cashbackTransactionId = 'CB-MOCK-' + require('crypto').randomBytes(6).toString('hex').toUpperCase();
    }
    await appointment.save();
    return res.json({
      success: true,
      message: appointment.cashbackStatus === 'issued'
        ? `Appointment completed. Cashback of ₹${parseFloat(appointment.discountAmount).toFixed(2)} issued.`
        : 'Appointment marked complete.',
      data: formatHospitalAppointment(appointment)
    });
  } catch (error) {
    console.error('Hospital complete appointment error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to complete appointment' });
  }
};

exports.rejectAppointment = async (req, res) => {
  try {
    const hospital = await requireHospital(req.user.id);
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    const appointment = await Appointment.findOne({
      where: { id: req.params.id, hospitalProfileId: hospital.id },
      include: [doctorInclude, patientInclude]
    });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'Only pending appointments can be rejected' });
    }
    appointment.status = 'rejected';
    appointment.rejectionReason = String(reason).trim();
    if (appointment.cashbackStatus === 'pending') {
      appointment.cashbackStatus = 'forfeited';
    }
    await appointment.save();
    return res.json({
      success: true,
      message: 'Appointment rejected.',
      data: formatHospitalAppointment(appointment)
    });
  } catch (error) {
    console.error('Hospital reject appointment error:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to reject appointment' });
  }
};

exports.formatHospitalAppointment = formatHospitalAppointment;
