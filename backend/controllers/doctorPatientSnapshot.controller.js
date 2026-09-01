'use strict';

// Doctors can view a patient's medical snapshot only if they share at
// least one appointment (any status). This unblocks history review during
// scheduling as well as consultation prep.
const {
  Appointment,
  DoctorProfile,
  PatientProfile,
  PatientAllergy,
  PatientMedicalCondition,
  User
} = require('../models');

function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

exports.getPatientSnapshot = async (req, res) => {
  try {
    const patientUserId = parseInt(req.params.patientUserId, 10);
    if (!Number.isInteger(patientUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid patient id' });
    }

    const doctorProfile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // Access gate: at least one appointment between this doctor and this patient.
    const linkCount = await Appointment.count({
      where: {
        doctorProfileId: doctorProfile.id,
        patientId: patientUserId
      }
    });
    if (linkCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have an appointment with this patient'
      });
    }

    const patientUser = await User.findByPk(patientUserId, {
      attributes: ['id', 'name', 'email', 'phone', 'dateOfBirth', 'gender']
    });
    if (!patientUser) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const patientProfile = await PatientProfile.findOne({
      where: { userId: patientUserId },
      attributes: ['id', 'bloodGroup', 'height', 'weight', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation']
    });

    const allergies = patientProfile
      ? await PatientAllergy.findAll({
          where: { patientProfileId: patientProfile.id },
          order: [['status', 'ASC'], ['createdAt', 'DESC']]
        })
      : [];

    const medicalConditions = patientProfile
      ? await PatientMedicalCondition.findAll({
          where: { patientProfileId: patientProfile.id },
          order: [['status', 'ASC'], ['createdAt', 'DESC']]
        })
      : [];

    const priorVisits = await Appointment.findAll({
      where: {
        doctorProfileId: doctorProfile.id,
        patientId: patientUserId
      },
      attributes: [
        'id', 'appointmentDate', 'appointmentTime', 'reason', 'status',
        'bookingNumber', 'paymentStatus', 'finalPrice', 'createdAt'
      ],
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']],
      limit: 20
    });

    return res.json({
      success: true,
      data: {
        patient: {
          id: patientUser.id,
          name: patientUser.name,
          email: patientUser.email,
          phone: patientUser.phone,
          gender: patientUser.gender,
          dateOfBirth: patientUser.dateOfBirth,
          age: ageFromDob(patientUser.dateOfBirth),
          bloodGroup: patientProfile?.bloodGroup || null,
          height: patientProfile?.height ? parseFloat(patientProfile.height) : null,
          weight: patientProfile?.weight ? parseFloat(patientProfile.weight) : null,
          emergencyContact: patientProfile?.emergencyContactName ? {
            name: patientProfile.emergencyContactName,
            phone: patientProfile.emergencyContactPhone,
            relation: patientProfile.emergencyContactRelation
          } : null
        },
        allergies: allergies.map(a => ({
          id: a.id,
          name: a.name,
          severity: a.severity,
          reaction: a.reaction,
          status: a.status,
          diagnosedDate: a.diagnosedDate,
          resolvedDate: a.resolvedDate,
          notes: a.notes
        })),
        medicalConditions: medicalConditions.map(c => ({
          id: c.id,
          name: c.name,
          severity: c.severity,
          status: c.status,
          diagnosedDate: c.diagnosedDate,
          resolvedDate: c.resolvedDate,
          notes: c.notes
        })),
        appointmentHistory: priorVisits.map(v => ({
          id: v.id,
          bookingNumber: v.bookingNumber,
          date: v.appointmentDate,
          time: v.appointmentTime,
          reason: v.reason,
          status: v.status,
          paymentStatus: v.paymentStatus,
          netCostAfterCashback: v.finalPrice !== null ? parseFloat(v.finalPrice) : null,
          createdAt: v.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get patient snapshot error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load patient snapshot' });
  }
};
