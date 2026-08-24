const { DoctorProfile, User, Specialization, HospitalProfile, DoctorAvailability } = require('../models');
const { PROFILE_REVIEW_STATUSES } = require('../utils/providerReview');

// Helper function to format availability days
function formatAvailabilityDays(availabilities) {
  if (!availabilities || availabilities.length === 0) return 'Not Available';
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = availabilities
    .filter(a => a.is_available)
    .map(a => dayNames[a.day_of_week])
    .sort((a, b) => {
      const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return order.indexOf(a) - order.indexOf(b);
    });
  
  if (days.length === 0) return 'Not Available';
  if (days.length === 7) return 'All Days';
  
  // Group consecutive days
  const grouped = [];
  let start = days[0];
  let prev = days[0];
  
  for (let i = 1; i < days.length; i++) {
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (dayOrder.indexOf(days[i]) !== dayOrder.indexOf(prev) + 1) {
      grouped.push(start === prev ? start : `${start}-${prev}`);
      start = days[i];
    }
    prev = days[i];
  }
  grouped.push(start === prev ? start : `${start}-${prev}`);
  
  return grouped.join(', ');
}

function formatAvailabilitySchedule(availabilities) {
  return (availabilities || [])
    .filter(availability => availability.is_available)
    .map(availability => ({
      id: availability.id,
      dayOfWeek: availability.day_of_week,
      startTime: String(availability.start_time).slice(0, 5),
      endTime: String(availability.end_time).slice(0, 5),
      isAvailable: availability.is_available
    }))
    .sort((left, right) => left.dayOfWeek - right.dayOfWeek);
}

// Format doctor data for Angular component
function formatDoctorForFrontend(profile) {
  const doctorJSON = profile.toJSON();

  return {
    id: doctorJSON.id,
    name: doctorJSON.user.name,

    specialization_id: doctorJSON.specializationId,
    hospital_id: doctorJSON.hospitalId,
  
    specialization: doctorJSON.specialization?.name || '',
    hospital: doctorJSON.hospital?.hospitalName || '',

    experience: `${doctorJSON.yearsOfExperience || 0} years`,
    rating: 0,
    fee: `${doctorJSON.consultationFee || 0}`,
    available: formatAvailabilityDays(doctorJSON.availabilities || []),
    availabilitySchedule: formatAvailabilitySchedule(doctorJSON.availabilities),
    email: doctorJSON.user.email,
    phone: doctorJSON.user.phone,
    qualification: doctorJSON.qualification || '',
    bio: '',
    image: doctorJSON.user.profileImage || 'https://via.placeholder.com/300x300',
    consultationDuration: 30
  };
}

const publicDoctorIncludes = [
  {
    model: User,
    as: 'user',
    required: true,
    where: { isActive: true, isBlocked: false },
    attributes: ['id', 'name', 'email', 'phone', 'profileImage']
  },
  { model: Specialization, as: 'specialization', required: true },
  { model: HospitalProfile, as: 'hospital', required: true },
  { model: DoctorAvailability, as: 'availabilities', required: false }
];

// GET all doctors
// The component will do client-side filtering, sorting in applyFiltersAndSort()
exports.getAll = async (req, res) => {
  try {
    const doctors = await DoctorProfile.findAll({
      where: { verificationStatus: PROFILE_REVIEW_STATUSES.APPROVED },
      include: publicDoctorIncludes,
      order: [['lastVerifiedAt', 'DESC']]
    });

    // Format for frontend
    const formattedDoctors = doctors.map(formatDoctorForFrontend);

    res.status(200).json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors
    });

  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
};

// GET single doctor by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await DoctorProfile.findOne({
      where: { id, verificationStatus: PROFILE_REVIEW_STATUSES.APPROVED },
      include: publicDoctorIncludes
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not publicly available'
      });
    }

    // Format for frontend
    const formattedDoctor = formatDoctorForFrontend(doctor);
    
    // Add additional details for single doctor view
    const doctorJSON = doctor.toJSON();
    formattedDoctor.hospitalLocation = [doctorJSON.hospital?.hospitalCity, doctorJSON.hospital?.hospitalState].filter(Boolean).join(', ');
    formattedDoctor.hospitalAddress = doctorJSON.hospital?.hospitalAddress;
    formattedDoctor.hospitalPhone = doctorJSON.hospital?.hospitalPhone;
    formattedDoctor.hospitalEmail = doctorJSON.hospital?.hospitalEmail;
    formattedDoctor.specializationDescription = doctorJSON.specialization?.description;
    res.status(200).json({
      success: true,
      data: formattedDoctor
    });

  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor',
      error: error.message
    });
  }
};