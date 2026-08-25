const {
  Appointment,
  DoctorAvailability,
  DoctorProfile,
  HospitalProfile,
  Specialization,
  User,
  Coupon,
  CouponUsage
} = require('../models');
const { Op } = require('sequelize');
const { isApprovedStatus } = require('../utils/providerReview');

const doctorInclude = {
  model: DoctorProfile,
  as: 'doctorProfile',
  include: [
    { model: User, as: 'user', attributes: ['id', 'name'] },
    { model: Specialization, as: 'specialization', attributes: ['id', 'name'] },
    { model: HospitalProfile, as: 'hospital', attributes: ['id', 'hospitalName'] }
  ]
};

const patientInclude = {
  model: User,
  as: 'patient',
  attributes: ['id', 'name', 'email', 'phone']
};

function formatAppointment(appointment) {
  const value = appointment.toJSON();
  return {
    id: value.id,
    doctorId: value.doctorProfileId,
    doctorName: value.doctorProfile?.user?.name || 'Doctor',
    specialization: value.doctorProfile?.specialization?.name || null,
    hospital: value.doctorProfile?.hospital?.hospitalName || null,
    date: value.appointmentDate,
    time: value.appointmentTime,
    reason: value.reason,
    status: value.status,
    rejectionReason: value.rejectionReason || null,
    couponCode: value.couponCode || null,
    couponId: value.couponId || null,
    originalPrice: value.originalPrice !== null && value.originalPrice !== undefined
      ? parseFloat(value.originalPrice) : null,
    discountAmount: value.discountAmount !== null && value.discountAmount !== undefined
      ? parseFloat(value.discountAmount) : 0,
    finalPrice: value.finalPrice !== null && value.finalPrice !== undefined
      ? parseFloat(value.finalPrice) : null,
    createdAt: value.createdAt
  };
}

function formatDoctorAppointment(appointment) {
  const value = appointment.toJSON();
  return {
    id: value.id,
    patientId: value.patientId,
    patientName: value.patient?.name || value.patientName,
    patientEmail: value.patient?.email || value.email,
    patientPhone: value.patient?.phone || value.phone,
    date: value.appointmentDate,
    time: value.appointmentTime,
    reason: value.reason,
    status: value.status,
    rejectionReason: value.rejectionReason || null,
    createdAt: value.createdAt
  };
}

function formatAdminAppointment(appointment) {
  return {
    ...formatAppointment(appointment),
    ...formatDoctorAppointment(appointment)
  };
}

async function getDoctorProfile(userId) {
  return DoctorProfile.findOne({ where: { userId } });
}

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason, couponCode } = req.body;
    if (!doctorId || !date || !time) {
      return res.status(400).json({ success: false, message: 'Doctor, date and time are required' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment date or time' });
    }

    const appointmentDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(appointmentDate.getTime()) || appointmentDate < today) {
      return res.status(400).json({ success: false, message: 'Appointment date cannot be in the past' });
    }

    const doctorProfile = await DoctorProfile.findByPk(doctorId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'isActive', 'isBlocked'] }]
    });
    if (!doctorProfile || !isApprovedStatus(doctorProfile.verificationStatus)
      || !doctorProfile.user?.isActive || doctorProfile.user?.isBlocked) {
      return res.status(404).json({ success: false, message: 'Doctor is not available for booking' });
    }

    const availability = await DoctorAvailability.findOne({
      where: {
        doctor_profile_id: doctorId,
        day_of_week: appointmentDate.getDay(),
        is_available: true
      }
    });
    if (!availability || time < availability.start_time.slice(0, 5) || time > availability.end_time.slice(0, 5)) {
      return res.status(400).json({ success: false, message: 'Selected time is outside the doctor\'s availability' });
    }

    // Pricing
    const originalPrice = doctorProfile.consultationFee !== null && doctorProfile.consultationFee !== undefined
      ? parseFloat(doctorProfile.consultationFee)
      : 0;

    let couponResult = { couponId: null, couponCode: null, discountAmount: 0, coupon: null };
    if (couponCode) {
      couponResult = await resolveCouponForBooking({
        couponCode,
        amount: originalPrice,
        hospitalId: doctorProfile.hospitalId,
        userId: req.user.id
      });
      if (couponResult.error) {
        return res.status(400).json({ success: false, message: couponResult.error });
      }
    }

    const finalPrice = Math.max(0, originalPrice - couponResult.discountAmount);

    const appointment = await Appointment.create({
      doctorProfileId: doctorId,
      patientId: req.user.id,
      patientName: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      appointmentDate: date,
      appointmentTime: time,
      reason: reason?.trim() || null,
      status: 'pending',
      couponCode: couponResult.couponCode,
      couponId: couponResult.couponId,
      originalPrice,
      discountAmount: couponResult.discountAmount,
      finalPrice
    });

    if (couponResult.coupon) {
      await CouponUsage.create({
        couponId: couponResult.coupon.id,
        userId: req.user.id,
        appointmentId: appointment.id,
        orderId: appointment.id,
        discountAmount: couponResult.discountAmount,
        usedAt: new Date()
      });
      await couponResult.coupon.increment('usedCount');
    }

    const createdAppointment = await Appointment.findByPk(appointment.id, { include: [doctorInclude] });
    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: formatAppointment(createdAppointment)
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to book appointment' });
  }
};

async function resolveCouponForBooking({ couponCode, amount, hospitalId, userId }) {
  const upper = String(couponCode).trim().toUpperCase();
  const coupon = await Coupon.unscoped().findOne({
    where: { code: upper, isDeleted: false, isActive: true },
    include: [{ model: HospitalProfile, as: 'hospitals', attributes: ['id'], through: { attributes: [] } }]
  });

  if (!coupon) {
    return { error: 'Invalid or inactive coupon code' };
  }
  if (!coupon.isValid()) {
    return { error: 'Coupon is expired or usage limit reached' };
  }
  if (coupon.minAmount && amount < parseFloat(coupon.minAmount)) {
    return { error: `Minimum order amount of ₹${coupon.minAmount} required` };
  }
  if (coupon.hospitals && coupon.hospitals.length > 0) {
    if (!hospitalId || !coupon.hospitals.some(h => h.id === hospitalId)) {
      return { error: 'Coupon is not valid for this doctor\'s hospital' };
    }
  }
  if (coupon.maxUsesPerUser && userId) {
    const userUses = await CouponUsage.count({
      where: { couponId: coupon.id, userId }
    });
    if (userUses >= coupon.maxUsesPerUser) {
      return { error: `You have already used this coupon the maximum allowed times (${coupon.maxUsesPerUser})` };
    }
  }

  const discountAmount = parseFloat(coupon.calculateDiscount(amount).toFixed(2));
  return {
    couponId: coupon.id,
    couponCode: coupon.code,
    discountAmount,
    coupon
  };
}

exports.getPatientAppointments = async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;
    const where = { patientId: req.user.id };
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
      include: [doctorInclude],
      order: [
        ['appointmentDate', 'DESC'],
        ['appointmentTime', 'DESC']
      ]
    });

    return res.json({ success: true, data: appointments.map(formatAppointment) });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorProfile = await getDoctorProfile(req.user.id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const { status, fromDate, toDate } = req.query;
    const where = { doctorProfileId: doctorProfile.id };
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
      include: [patientInclude],
      order: [
        ['appointmentDate', 'DESC'],
        ['appointmentTime', 'DESC']
      ]
    });

    return res.json({ success: true, data: appointments.map(formatDoctorAppointment) });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor appointments' });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (req.user.role === 'patient' && appointment.patientId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }
    if (req.user.role === 'doctor') {
      const doctorProfile = await getDoctorProfile(req.user.id);
      if (!doctorProfile || appointment.doctorProfileId !== doctorProfile.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
      }
    }
    if (['cancelled', 'completed'].includes(appointment.status)) {
      return res.status(409).json({
        success: false,
        message: `Appointment is already ${appointment.status}`
      });
    }

    // Refund coupon usage if any was applied at booking
    if (appointment.couponId) {
      const usageCount = await CouponUsage.count({ where: { appointmentId: appointment.id } });
      if (usageCount > 0) {
        await CouponUsage.destroy({ where: { appointmentId: appointment.id } });
        const coupon = await Coupon.unscoped().findByPk(appointment.couponId);
        if (coupon && coupon.usedCount > 0) {
          await coupon.decrement('usedCount', { by: Math.min(usageCount, coupon.usedCount) });
        }
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const refreshed = await Appointment.findByPk(appointment.id, { include: [doctorInclude] });
    return res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: formatAppointment(refreshed)
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
};

exports.approveAppointment = async (req, res) => {
  try {
    const doctorProfile = await getDoctorProfile(req.user.id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        doctorProfileId: doctorProfile.id
      },
      include: [patientInclude]
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (appointment.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'Only pending appointments can be approved' });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    return res.json({
      success: true,
      message: 'Appointment approved successfully',
      data: formatDoctorAppointment(appointment)
    });
  } catch (error) {
    console.error('Approve appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve appointment' });
  }
};

exports.rejectAppointment = async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason || String(reason).trim() === '') {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const doctorProfile = await getDoctorProfile(req.user.id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        doctorProfileId: doctorProfile.id
      },
      include: [patientInclude]
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (appointment.status !== 'pending') {
      return res.status(409).json({ success: false, message: 'Only pending appointments can be rejected' });
    }

    // Refund coupon usage if one was applied at booking
    if (appointment.couponId) {
      const usageCount = await CouponUsage.count({ where: { appointmentId: appointment.id } });
      if (usageCount > 0) {
        await CouponUsage.destroy({ where: { appointmentId: appointment.id } });
        const coupon = await Coupon.unscoped().findByPk(appointment.couponId);
        if (coupon && coupon.usedCount > 0) {
          await coupon.decrement('usedCount', { by: Math.min(usageCount, coupon.usedCount) });
        }
      }
    }

    appointment.status = 'rejected';
    appointment.rejectionReason = String(reason).trim();
    await appointment.save();

    return res.json({
      success: true,
      message: 'Appointment rejected successfully',
      data: formatDoctorAppointment(appointment)
    });
  } catch (error) {
    console.error('Reject appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject appointment' });
  }
};

exports.bulkApproveAppointments = async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }

    const doctorProfile = await getDoctorProfile(req.user.id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const appointments = await Appointment.findAll({
      where: {
        id: ids,
        doctorProfileId: doctorProfile.id,
        status: 'pending'
      },
      include: [patientInclude]
    });

    const approved = [];
    for (const appt of appointments) {
      appt.status = 'confirmed';
      await appt.save();
      approved.push(formatDoctorAppointment(appt));
    }

    return res.json({
      success: true,
      message: `${approved.length} appointment(s) confirmed`,
      data: { approved, skipped: ids.length - approved.length }
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    return res.status(500).json({ success: false, message: 'Failed to bulk approve appointments' });
  }
};

exports.getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [doctorInclude, patientInclude],
      order: [
        ['appointmentDate', 'DESC'],
        ['appointmentTime', 'DESC']
      ]
    });

    return res.json({ success: true, data: appointments.map(formatAdminAppointment) });
  } catch (error) {
    console.error('Get admin appointments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};