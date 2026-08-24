const {
  Appointment,
  DoctorAvailability,
  DoctorProfile,
  HospitalProfile,
  Specialization,
  User
} = require('../models');
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
    const { doctorId, date, time, reason } = req.body;
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

    const appointment = await Appointment.create({
      doctorProfileId: doctorId,
      patientId: req.user.id,
      patientName: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      appointmentDate: date,
      appointmentTime: time,
      reason: reason?.trim() || null,
      status: 'pending'
    });

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

exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { patientId: req.user.id },
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

    const appointments = await Appointment.findAll({
      where: { doctorProfileId: doctorProfile.id },
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