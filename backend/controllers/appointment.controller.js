const {
  Appointment,
  DoctorAvailability,
  DoctorProfile,
  DoctorPractice,
  HospitalProfile,
  Specialization,
  User,
  Coupon,
  CouponUsage
} = require('../models');
const { Op } = require('sequelize');
const { isApprovedStatus } = require('../utils/providerReview');
const { computeCommission } = require('../utils/practiceCommission');
const { generateBookingNumber } = require('../utils/bookingNumber');
const { PRACTICE_STATUSES } = require('../models/doctor-practice');

const doctorInclude = {
  model: DoctorProfile,
  as: 'doctorProfile',
  include: [
    { model: User, as: 'user', attributes: ['id', 'name'] },
    { model: Specialization, as: 'specialization', attributes: ['id', 'name'] }
  ]
};

const hospitalInclude = {
  model: HospitalProfile,
  as: 'hospitalProfile',
  attributes: ['id', 'hospitalName', 'hospitalKind', 'hospitalCity', 'hospitalState']
};

const patientInclude = {
  model: User,
  as: 'patient',
  attributes: ['id', 'name', 'email', 'phone']
};

function formatAppointment(appointment) {
  const value = appointment.toJSON();
  const numeric = (v) => (v !== null && v !== undefined) ? parseFloat(v) : 0;
  const withHospital = !!value.hospitalProfileId;
  return {
    id: value.id,
    doctorId: value.doctorProfileId,
    doctorName: value.doctorProfile?.user?.name
      || (withHospital && !value.doctorProfileId ? (value.hospitalProfile?.hospitalName || 'Hospital') : 'Doctor'),
    specialization: value.doctorProfile?.specialization?.name || null,
    hospital: value.hospitalProfile?.hospitalName || null,
    hospitalProfileId: value.hospitalProfileId || null,
    practiceId: value.practiceId || null,
    isHospitalBooking: withHospital && !value.doctorProfileId,
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
    platformRevenueAmount: numeric(value.platformRevenueAmount),
    doctorPayoutAmount: numeric(value.doctorPayoutAmount),
    bookingNumber: value.bookingNumber || null,
    paymentMode: value.paymentMode || 'offline',
    paymentStatus: value.paymentStatus || 'pending',
    paidAt: value.paidAt || null,
    paymentTransactionId: value.paymentTransactionId || null,
    cashbackStatus: value.cashbackStatus || 'none',
    cashbackIssuedAt: value.cashbackIssuedAt || null,
    cashbackTransactionId: value.cashbackTransactionId || null,
    createdAt: value.createdAt
  };
}

function formatDoctorAppointment(appointment) {
  const value = appointment.toJSON();
  const numeric = (v) => (v !== null && v !== undefined) ? parseFloat(v) : 0;
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
    hospital: value.hospitalProfile?.hospitalName || null,
    originalPrice: value.originalPrice !== null && value.originalPrice !== undefined
      ? parseFloat(value.originalPrice) : null,
    finalPrice: value.finalPrice !== null && value.finalPrice !== undefined
      ? parseFloat(value.finalPrice) : null,
    doctorPayoutAmount: numeric(value.doctorPayoutAmount),
    bookingNumber: value.bookingNumber || null,
    paymentMode: value.paymentMode || 'offline',
    paymentStatus: value.paymentStatus || 'pending',
    cashbackStatus: value.cashbackStatus || 'none',
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
    const { doctorId, hospitalId, practiceId, date, time, reason, couponCode, paymentMode, expectedFee } = req.body;
    if ((!doctorId && !hospitalId) || !date || !time) {
      return res.status(400).json({ success: false, message: 'Doctor or hospital, plus date and time, are required' });
    }
    if (doctorId && hospitalId) {
      return res.status(400).json({ success: false, message: 'Pick either a doctor or a hospital, not both' });
    }
    const mode = paymentMode === 'online' ? 'online' : 'offline';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment date or time' });
    }

    const appointmentDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(appointmentDate.getTime()) || appointmentDate < today) {
      return res.status(400).json({ success: false, message: 'Appointment date cannot be in the past' });
    }

    // Branch: doctor-directed vs hospital-directed booking.
    let doctorProfileForRow = null;
    let practice = null;
    let hospitalForBooking = null;
    let originalPrice = 0;

    if (doctorId) {
      const doctorProfile = await DoctorProfile.findByPk(doctorId, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'isActive', 'isBlocked'] }]
      });
      if (!doctorProfile || !isApprovedStatus(doctorProfile.verificationStatus)
        || !doctorProfile.user?.isActive || doctorProfile.user?.isBlocked) {
        return res.status(404).json({ success: false, message: 'Doctor is not available for booking' });
      }
      doctorProfileForRow = doctorProfile;

      if (practiceId) {
        practice = await DoctorPractice.findOne({
          where: {
            id: parseInt(practiceId, 10),
            doctorProfileId: doctorProfile.id,
            isActive: true,
            status: PRACTICE_STATUSES.ACTIVE
          },
          include: [{ model: HospitalProfile, as: 'hospital' }]
        });
        if (!practice) {
          return res.status(400).json({ success: false, message: 'Selected hospital is not available for this doctor' });
        }
      } else {
        practice = await DoctorPractice.findOne({
          where: {
            doctorProfileId: doctorProfile.id,
            isPrimary: true,
            isActive: true,
            status: PRACTICE_STATUSES.ACTIVE
          },
          include: [{ model: HospitalProfile, as: 'hospital' }]
        });
        if (!practice) {
          return res.status(400).json({ success: false, message: 'Doctor has no active practice available for booking' });
        }
      }

      const availability = await DoctorAvailability.findOne({
        where: {
          practice_id: practice.id,
          day_of_week: appointmentDate.getDay(),
          is_available: true
        }
      });
      if (!availability || time < availability.start_time.slice(0, 5) || time > availability.end_time.slice(0, 5)) {
        return res.status(400).json({ success: false, message: 'Selected time is outside the doctor\'s availability at this hospital' });
      }

      hospitalForBooking = practice.hospital;
      originalPrice = parseFloat(practice.consultationFee) || 0;
    } else {
      const hospId = parseInt(hospitalId, 10);
      if (!Number.isInteger(hospId)) {
        return res.status(400).json({ success: false, message: 'Invalid hospital id' });
      }
      const { HospitalAvailability } = require('../models');
      const hospital = await HospitalProfile.findByPk(hospId, {
        include: [{ model: User, as: 'user', attributes: ['id', 'isActive', 'isBlocked'] }]
      });
      if (!hospital || !isApprovedStatus(hospital.verificationStatus)
        || !hospital.user?.isActive || hospital.user?.isBlocked) {
        return res.status(404).json({ success: false, message: 'Hospital is not available for booking' });
      }

      // If hospital admin set weekly hours, enforce them; otherwise allow any time.
      const slot = await HospitalAvailability.findOne({
        where: {
          hospitalProfileId: hospital.id,
          dayOfWeek: appointmentDate.getDay(),
          isAvailable: true
        }
      });
      const hasScheduleForDay = !!slot;
      const anyScheduleAtAll = await HospitalAvailability.count({
        where: { hospitalProfileId: hospital.id, isAvailable: true }
      });
      if (anyScheduleAtAll > 0) {
        if (!hasScheduleForDay) {
          return res.status(400).json({ success: false, message: 'Hospital is closed on the selected day' });
        }
        const startHM = String(slot.startTime).slice(0, 5);
        const endHM = String(slot.endTime).slice(0, 5);
        if (time < startHM || time > endHM) {
          return res.status(400).json({ success: false, message: `Selected time is outside hospital hours (${startHM}-${endHM})` });
        }
      }

      hospitalForBooking = hospital;
      originalPrice = parseFloat(hospital.defaultConsultationFee) || 0;
    }

    // Fee-change guard: if the client sent the fee it saw and it no longer matches
    // the source of truth, block with 409 so the UI can prompt the patient rather
    // than silently billing them a different amount.
    if (expectedFee !== undefined && expectedFee !== null && expectedFee !== '') {
      const seen = Number(expectedFee);
      if (Number.isFinite(seen) && Math.abs(seen - originalPrice) > 0.005) {
        return res.status(409).json({
          success: false,
          code: 'FEE_CHANGED',
          message: `Consultation fee has changed from ₹${seen.toFixed(2)} to ₹${originalPrice.toFixed(2)}. Please review before booking.`,
          currentFee: originalPrice,
          previousFee: seen
        });
      }
    }

    let couponResult = { couponId: null, couponCode: null, discountAmount: 0, coupon: null };
    if (couponCode) {
      couponResult = await resolveCouponForBooking({
        couponCode,
        amount: originalPrice,
        hospitalId: hospitalForBooking.id,
        userId: req.user.id
      });
      if (couponResult.error) {
        return res.status(400).json({ success: false, message: couponResult.error });
      }
    }

    const finalPrice = Math.max(0, originalPrice - couponResult.discountAmount);
    const hospitalCommissionPercent = parseFloat(hospitalForBooking?.hospitalCommissionPercent) || 0;
    const commission = computeCommission({ basePrice: originalPrice, hospitalCommissionPercent });
    const cashbackStatus = couponResult.discountAmount > 0 ? 'pending' : 'none';

    let appointment;
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        appointment = await Appointment.create({
          doctorProfileId: doctorProfileForRow ? doctorProfileForRow.id : null,
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
          finalPrice,
          practiceId: practice ? practice.id : null,
          hospitalProfileId: hospitalForBooking.id,
          platformRevenueAmount: commission.platformRevenue,
          doctorPayoutAmount: commission.doctorPayout,
          paymentMode: mode,
          paymentStatus: 'pending',
          bookingNumber: generateBookingNumber(),
          cashbackStatus
        });
        break;
      } catch (err) {
        lastErr = err;
        if (err?.name !== 'SequelizeUniqueConstraintError') throw err;
      }
    }
    if (!appointment) throw lastErr;

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

    const createdAppointment = await Appointment.findByPk(appointment.id, {
      include: [doctorInclude, hospitalInclude]
    });
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
      include: [doctorInclude, hospitalInclude],
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
      include: [patientInclude, hospitalInclude],
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
    if (req.user.role === 'hospital') {
      const { HospitalProfile } = require('../models');
      const hospitalProfile = await HospitalProfile.findOne({ where: { userId: req.user.id } });
      if (!hospitalProfile || appointment.hospitalProfileId !== hospitalProfile.id) {
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
    if (appointment.cashbackStatus === 'pending') {
      appointment.cashbackStatus = 'forfeited';
    }
    await appointment.save();

    const refreshed = await Appointment.findByPk(appointment.id, { include: [doctorInclude, hospitalInclude] });
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
      include: [patientInclude, hospitalInclude]
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
      include: [patientInclude, hospitalInclude]
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
    if (appointment.cashbackStatus === 'pending') {
      appointment.cashbackStatus = 'forfeited';
    }
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

exports.getPatientAnalytics = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { patientId: req.user.id },
      include: [doctorInclude, hospitalInclude],
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
    });

    const rows = appointments.map((a) => formatAppointment(a));

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().slice(0, 10);

    const statusCounts = { pending: 0, confirmed: 0, cancelled: 0, completed: 0, rejected: 0 };
    let totalSpent = 0;
    let totalSaved = 0;
    let upcomingCount = 0;
    let nextAppointment = null;
    const doctorMap = new Map();
    const specializationMap = new Map();

    // Init last 6 months buckets (YYYY-MM keys)
    const monthMap = new Map();
    const monthOrder = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      monthMap.set(key, 0);
      monthOrder.push({ key, label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });
    }

    for (const row of rows) {
      if (statusCounts[row.status] !== undefined) statusCounts[row.status]++;

      if (['confirmed', 'completed'].includes(row.status)) {
        // Patient pays the full consultation fee (originalPrice); savings only
        // land when cashback actually gets issued.
        if (typeof row.originalPrice === 'number' && !Number.isNaN(row.originalPrice)) {
          totalSpent += row.originalPrice;
        }
        if (row.cashbackStatus === 'issued' && typeof row.discountAmount === 'number' && !Number.isNaN(row.discountAmount)) {
          totalSaved += row.discountAmount;
        }
      }

      const dateStr = row.date ? String(row.date).slice(0, 10) : null;
      if (dateStr) {
        const monthKey = dateStr.slice(0, 7);
        if (monthMap.has(monthKey)) monthMap.set(monthKey, monthMap.get(monthKey) + 1);

        if (dateStr >= todayStr && ['pending', 'confirmed'].includes(row.status)) {
          upcomingCount++;
          if (!nextAppointment || dateStr < String(nextAppointment.date).slice(0, 10)) {
            nextAppointment = row;
          }
        }
      }

      if (row.doctorId) {
        if (!doctorMap.has(row.doctorId)) {
          doctorMap.set(row.doctorId, {
            id: row.doctorId,
            name: row.doctorName,
            specialization: row.specialization,
            count: 0,
            lastVisit: dateStr
          });
        }
        const doc = doctorMap.get(row.doctorId);
        doc.count++;
        if (dateStr && (!doc.lastVisit || dateStr > doc.lastVisit)) doc.lastVisit = dateStr;
      }

      if (row.specialization) {
        specializationMap.set(row.specialization, (specializationMap.get(row.specialization) || 0) + 1);
      }
    }

    const topDoctors = Array.from(doctorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topSpecializations = Array.from(specializationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const monthlyTrend = monthOrder.map(({ key, label }) => ({
      label,
      count: monthMap.get(key) || 0
    }));

    const total = rows.length;
    const recentActivity = rows.slice(0, 5);

    return res.json({
      success: true,
      data: {
        totals: {
          totalAppointments: total,
          upcomingAppointments: upcomingCount,
          completedAppointments: statusCounts.completed,
          uniqueDoctors: doctorMap.size,
          totalSpent: Math.round(totalSpent * 100) / 100,
          totalSaved: Math.round(totalSaved * 100) / 100
        },
        statusBreakdown: statusCounts,
        monthlyTrend,
        topDoctors,
        topSpecializations,
        nextAppointment,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get patient analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

exports.getDoctorAnalytics = async (req, res) => {
  try {
    const doctorProfile = await getDoctorProfile(req.user.id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const appointments = await Appointment.findAll({
      where: { doctorProfileId: doctorProfile.id },
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
    });

    const rows = appointments.map((a) => a.toJSON());

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().slice(0, 10);

    const statusCounts = { pending: 0, confirmed: 0, cancelled: 0, completed: 0, rejected: 0 };
    let totalRevenue = 0;
    let totalDoctorPayout = 0;
    let revenueAppointmentCount = 0;
    let upcomingCount = 0;
    const patientMap = new Map();
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    const hourBuckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    // Init last 30-day buckets
    const dailyMap = new Map();
    const dayOrder = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, 0);
      dayOrder.push(key);
    }

    const toDateStr = (value) => {
      if (!value) return null;
      if (typeof value === 'string') return value.slice(0, 10);
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    };

    for (const row of rows) {
      if (statusCounts[row.status] !== undefined) statusCounts[row.status]++;

      if (['confirmed', 'completed'].includes(row.status)) {
        // Doctor's revenue is the fee actually charged to the patient
        // (originalPrice), not the post-cashback net.
        const priceRaw = row.originalPrice !== null && row.originalPrice !== undefined
          ? row.originalPrice
          : row.finalPrice;
        const price = priceRaw !== null && priceRaw !== undefined ? parseFloat(priceRaw) : null;
        if (price !== null && !Number.isNaN(price)) {
          totalRevenue += price;
          revenueAppointmentCount++;
        }
        const payoutRaw = row.doctorPayoutAmount;
        const payout = payoutRaw !== null && payoutRaw !== undefined ? parseFloat(payoutRaw) : 0;
        if (!Number.isNaN(payout)) totalDoctorPayout += payout;
      }

      const dateStr = toDateStr(row.appointmentDate);
      if (dateStr) {
        if (dailyMap.has(dateStr)) dailyMap.set(dateStr, dailyMap.get(dateStr) + 1);
        const dt = new Date(dateStr + 'T00:00:00');
        if (!Number.isNaN(dt.getTime())) weekdayCounts[dt.getDay()]++;
        if (dateStr >= todayStr && ['pending', 'confirmed'].includes(row.status)) {
          upcomingCount++;
        }
      }

      if (row.appointmentTime) {
        const [hStr] = String(row.appointmentTime).split(':');
        const hour = parseInt(hStr, 10);
        if (!Number.isNaN(hour)) {
          if (hour < 12) hourBuckets.morning++;
          else if (hour < 16) hourBuckets.afternoon++;
          else if (hour < 20) hourBuckets.evening++;
          else hourBuckets.night++;
        }
      }

      const pKey = row.patientId;
      if (!patientMap.has(pKey)) {
        patientMap.set(pKey, {
          id: row.patientId,
          name: row.patientName || 'Patient',
          count: 0,
          lastVisit: dateStr
        });
      }
      const patient = patientMap.get(pKey);
      patient.count++;
      if (dateStr && (!patient.lastVisit || dateStr > patient.lastVisit)) {
        patient.lastVisit = dateStr;
      }
    }

    const topPatients = Array.from(patientMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dailyTrend = dayOrder.map((key) => ({ date: key, count: dailyMap.get(key) || 0 }));

    const total = rows.length;
    const avgRevenue = revenueAppointmentCount > 0 ? totalRevenue / revenueAppointmentCount : 0;
    const avgDoctorPayout = revenueAppointmentCount > 0 ? totalDoctorPayout / revenueAppointmentCount : 0;
    const completionRate = total > 0 ? (statusCounts.completed / total) * 100 : 0;

    return res.json({
      success: true,
      data: {
        totals: {
          totalAppointments: total,
          upcomingAppointments: upcomingCount,
          uniquePatients: patientMap.size,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averageRevenue: Math.round(avgRevenue * 100) / 100,
          totalDoctorPayout: Math.round(totalDoctorPayout * 100) / 100,
          averageDoctorPayout: Math.round(avgDoctorPayout * 100) / 100,
          completionRate: Math.round(completionRate * 10) / 10
        },
        statusBreakdown: statusCounts,
        dailyTrend,
        weekdayDistribution: weekdayCounts,
        hourDistribution: hourBuckets,
        topPatients
      }
    });
  } catch (error) {
    console.error('Get doctor analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
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
      include: [patientInclude, hospitalInclude]
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

// Mock payment endpoint. Real gateway integration slots in here.
// Patient always pays the full consultation fee (original_price); any coupon
// discount is issued as cashback after the doctor marks the appointment complete.
exports.payAppointment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment id' });
    }
    const appointment = await Appointment.findByPk(id);
    if (!appointment || appointment.patientId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (appointment.paymentMode !== 'online') {
      return res.status(400).json({ success: false, message: 'This appointment is offline; pay at the hospital desk' });
    }
    if (['cancelled', 'rejected'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'Appointment is no longer active' });
    }
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Appointment is already paid' });
    }
    appointment.paymentStatus = 'paid';
    appointment.paidAt = new Date();
    appointment.paymentTransactionId = 'MOCK-' + require('crypto').randomBytes(6).toString('hex').toUpperCase();
    await appointment.save();

    const refreshed = await Appointment.findByPk(id, { include: [doctorInclude, hospitalInclude] });
    return res.json({
      success: true,
      message: 'Payment successful',
      data: formatAppointment(refreshed)
    });
  } catch (error) {
    console.error('Pay appointment error:', error);
    return res.status(500).json({ success: false, message: 'Payment failed' });
  }
};

// Doctor marks a confirmed appointment complete. If the patient used a coupon,
// this issues the cashback (mock) in the same call — real system would queue
// this for a 24h delay.
exports.completeAppointment = async (req, res) => {
  try {
    const doctorProfile = await getDoctorProfile(req.user.id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const appointment = await Appointment.findOne({
      where: { id: req.params.id, doctorProfileId: doctorProfile.id },
      include: [patientInclude, hospitalInclude]
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (appointment.status !== 'confirmed') {
      return res.status(409).json({ success: false, message: 'Only confirmed appointments can be marked complete' });
    }
    // Online rows must be paid through the gateway before completion.
    // Offline rows are settled at the hospital desk on the day — the doctor
    // marking complete attests cash was collected.
    if (appointment.paymentStatus !== 'paid') {
      if (appointment.paymentMode === 'offline') {
        appointment.paymentStatus = 'paid';
        appointment.paidAt = new Date();
        appointment.paymentTransactionId = 'COLLECTED-AT-DESK-' + require('crypto').randomBytes(6).toString('hex').toUpperCase();
      } else {
        return res.status(409).json({
          success: false,
          message: 'Appointment is not fully paid yet. Ask the patient to complete payment before marking complete.'
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
        ? `Appointment completed. Cashback of ₹${parseFloat(appointment.discountAmount).toFixed(2)} issued to the patient.`
        : 'Appointment marked complete.',
      data: formatDoctorAppointment(appointment)
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark appointment complete' });
  }
};

// Receipt payload — the PDF is rendered client-side.
exports.getAppointmentReceipt = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment id' });
    }
    const appointment = await Appointment.findByPk(id, {
      include: [doctorInclude, hospitalInclude, patientInclude]
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    const role = req.user.role;
    const allowed = (role === 'patient' && appointment.patientId === req.user.id)
      || role === 'admin'
      || (role === 'doctor' && appointment.doctorProfile?.userId === req.user.id)
      || (role === 'hospital' && appointment.hospitalProfile?.userId === req.user.id);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Not allowed to view this receipt' });
    }
    const value = appointment.toJSON();
    const originalPrice = value.originalPrice !== null ? parseFloat(value.originalPrice) : null;
    const discountAmount = value.discountAmount !== null ? parseFloat(value.discountAmount) : 0;
    const finalPrice = value.finalPrice !== null ? parseFloat(value.finalPrice) : null;
    const bookingType = value.doctorProfileId ? 'doctor' : 'hospital';
    const hospitalName = value.hospitalProfile?.hospitalName || null;
    return res.json({
      success: true,
      data: {
        bookingNumber: value.bookingNumber,
        bookingType,
        paymentMode: value.paymentMode,
        paymentStatus: value.paymentStatus,
        paidAt: value.paidAt,
        paymentTransactionId: value.paymentTransactionId,
        appointmentDate: value.appointmentDate,
        appointmentTime: value.appointmentTime,
        patientName: value.patient?.name || value.patientName,
        patientEmail: value.patient?.email || value.email,
        patientPhone: value.patient?.phone || value.phone,
        doctorName: value.doctorProfile?.user?.name || (bookingType === 'hospital' ? hospitalName : null),
        specialization: value.doctorProfile?.specialization?.name || null,
        hospitalName,
        hospitalCity: value.hospitalProfile?.hospitalCity || null,
        appointmentStatus: value.status,
        originalPrice,
        discountAmount,
        finalPrice,
        // Patient always pays the full consultation fee upfront.
        amountPayable: originalPrice,
        couponCode: value.couponCode || null,
        cashbackAmount: discountAmount,
        cashbackStatus: value.cashbackStatus || 'none',
        cashbackIssuedAt: value.cashbackIssuedAt || null,
        cashbackTransactionId: value.cashbackTransactionId || null,
        platformCommission: value.platformRevenueAmount !== null ? parseFloat(value.platformRevenueAmount) : 0,
        // For a hospital-direct booking this is the hospital's retention (fee - commission),
        // not a doctor payout. The frontend labels it accordingly.
        doctorPayout: value.doctorPayoutAmount !== null ? parseFloat(value.doctorPayoutAmount) : 0
      }
    });
  } catch (error) {
    console.error('Get appointment receipt error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load receipt' });
  }
};


