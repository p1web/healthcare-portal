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
  return {
    id: value.id,
    doctorId: value.doctorProfileId,
    doctorName: value.doctorProfile?.user?.name || 'Doctor',
    specialization: value.doctorProfile?.specialization?.name || null,
    hospital: value.hospitalProfile?.hospitalName || null,
    hospitalProfileId: value.hospitalProfileId || null,
    practiceId: value.practiceId || null,
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
    const { doctorId, practiceId, date, time, reason, couponCode } = req.body;
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

    // Resolve practice: explicit practiceId wins; otherwise fall back to the doctor's primary practice.
    let practice = null;
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

    // Fee is per practice, not per doctor.
    const originalPrice = parseFloat(practice.consultationFee) || 0;

    let couponResult = { couponId: null, couponCode: null, discountAmount: 0, coupon: null };
    if (couponCode) {
      couponResult = await resolveCouponForBooking({
        couponCode,
        amount: originalPrice,
        hospitalId: practice.hospitalProfileId,
        userId: req.user.id
      });
      if (couponResult.error) {
        return res.status(400).json({ success: false, message: couponResult.error });
      }
    }

    const finalPrice = Math.max(0, originalPrice - couponResult.discountAmount);
    const hospitalCommissionPercent = parseFloat(practice.hospital?.hospitalCommissionPercent) || 0;
    const commission = computeCommission({ basePrice: finalPrice, hospitalCommissionPercent });

    const appointment = await Appointment.create({
      doctorProfileId: doctorProfile.id,
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
      practiceId: practice.id,
      hospitalProfileId: practice.hospitalProfileId,
      platformRevenueAmount: commission.platformRevenue,
      doctorPayoutAmount: commission.doctorPayout
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
        if (typeof row.finalPrice === 'number' && !Number.isNaN(row.finalPrice)) {
          totalSpent += row.finalPrice;
        } else if (typeof row.originalPrice === 'number' && !Number.isNaN(row.originalPrice)) {
          totalSpent += row.originalPrice;
        }
        if (typeof row.discountAmount === 'number' && !Number.isNaN(row.discountAmount)) {
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
        const priceRaw = row.finalPrice !== null && row.finalPrice !== undefined
          ? row.finalPrice
          : row.originalPrice;
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
