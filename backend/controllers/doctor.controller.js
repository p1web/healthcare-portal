const { Doctor, Specialization, Hospital, DoctorAvailability } = require('../models');
const { Op } = require('sequelize');

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

// Format doctor data for Angular component
function formatDoctorForFrontend(doctor) {
  const doctorJSON = doctor.toJSON();

  return {
    id: doctorJSON.id,
    name: doctorJSON.name,
    specialization: doctorJSON.specialization?.name || '',
    hospital: doctorJSON.hospital?.name || '',
    experience: `${doctorJSON.experience} years`,
    rating: parseFloat(doctorJSON.rating || 0),
    fee: `${doctorJSON.fee}`,
    available: formatAvailabilityDays(doctorJSON.availabilities || []),
    email: doctorJSON.email,
    phone: doctorJSON.phone,
    qualification: doctorJSON.qualification || '',
    bio: doctorJSON.bio || '',
    image: doctorJSON.image || 'https://via.placeholder.com/300x300',
    consultationDuration: doctorJSON.consultation_duration
  };
}

// GET all doctors
// The component will do client-side filtering, sorting in applyFiltersAndSort()
exports.getAll = async (req, res) => {
  try {
    // Fetch all doctors with associations
    const doctors = await Doctor.findAll({
      include: [
        {
          model: Specialization,
          as: 'specialization',
          attributes: ['id', 'name']
        },
        {
          model: Hospital,
          as: 'hospital',
          attributes: ['id', 'name', 'location']
        },
        {
          model: DoctorAvailability,
          as: 'availabilities',
          attributes: ['id', 'day_of_week', 'start_time', 'end_time', 'is_available']
        }
      ],
      order: [['rating', 'DESC']]
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

    const doctor = await Doctor.findByPk(id, {
      include: [
        {
          model: Specialization,
          as: 'specialization',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Hospital,
          as: 'hospital',
          attributes: ['id', 'name', 'location', 'address', 'phone', 'email']
        },
        {
          model: DoctorAvailability,
          as: 'availabilities',
          attributes: ['id', 'day_of_week', 'start_time', 'end_time', 'is_available'],
          order: [['day_of_week', 'ASC']]
        }
      ]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Format for frontend
    const formattedDoctor = formatDoctorForFrontend(doctor);
    
    // Add additional details for single doctor view
    const doctorJSON = doctor.toJSON();
    formattedDoctor.hospitalLocation = doctorJSON.hospital?.location;
    formattedDoctor.hospitalAddress = doctorJSON.hospital?.address;
    formattedDoctor.hospitalPhone = doctorJSON.hospital?.phone;
    formattedDoctor.hospitalEmail = doctorJSON.hospital?.email;
    formattedDoctor.specializationDescription = doctorJSON.specialization?.description;
    formattedDoctor.availabilitySchedule = doctorJSON.availabilities;

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

// CREATE new doctor
exports.create = async (req, res) => {
  try {
    const {
      name,
      specialization,
      hospital,
      experience,
      rating,
      fee,
      email,
      phone,
      qualification,
      bio,
      image,
      consultationDuration
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !specialization || !hospital) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, phone, specialization, hospital'
      });
    }

    // Find specialization by name
    const specializationRecord = await Specialization.findOne({
      where: { name: { [Op.like]: `%${specialization}%` } }
    });

    if (!specializationRecord) {
      return res.status(400).json({
        success: false,
        message: `Specialization '${specialization}' not found`
      });
    }

    // Find hospital by name
    const hospitalRecord = await Hospital.findOne({
      where: { name: { [Op.like]: `%${hospital}%` } }
    });

    if (!hospitalRecord) {
      return res.status(400).json({
        success: false,
        message: `Hospital '${hospital}' not found`
      });
    }

    // Extract numeric values
    const experienceYears = typeof experience === 'string' 
      ? parseInt(experience.replace(/[^0-9]/g, '')) 
      : experience;
    
    const feeAmount = typeof fee === 'string'
      ? parseFloat(fee.replace(/[^0-9.]/g, ''))
      : fee;

    // Create doctor
    const doctor = await Doctor.create({
      name,
      specialization_id: specializationRecord.id,
      hospital_id: hospitalRecord.id,
      experience: experienceYears,
      rating: rating || 0,
      fee: feeAmount,
      email,
      phone,
      qualification: qualification || '',
      bio: bio || '',
      image: image || '',
      consultation_duration: consultationDuration || 30
    });

    // Fetch with associations
    const createdDoctor = await Doctor.findByPk(doctor.id, {
      include: [
        { model: Specialization, as: 'specialization' },
        { model: Hospital, as: 'hospital' },
        { model: DoctorAvailability, as: 'availabilities' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: formatDoctorForFrontend(createdDoctor)
    });

  } catch (error) {
    console.error('Error creating doctor:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating doctor',
      error: error.message
    });
  }
};

// UPDATE doctor
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const doctor = await Doctor.findByPk(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const updates = {};

    // Handle specialization update
    if (updateData.specialization) {
      const specializationRecord = await Specialization.findOne({
        where: { name: { [Op.like]: `%${updateData.specialization}%` } }
      });
      if (specializationRecord) {
        updates.specialization_id = specializationRecord.id;
      }
    }

    // Handle hospital update
    if (updateData.hospital) {
      const hospitalRecord = await Hospital.findOne({
        where: { name: { [Op.like]: `%${updateData.hospital}%` } }
      });
      if (hospitalRecord) {
        updates.hospital_id = hospitalRecord.id;
      }
    }

    // Extract numeric values
    if (updateData.experience) {
      updates.experience = typeof updateData.experience === 'string'
        ? parseInt(updateData.experience.replace(/[^0-9]/g, ''))
        : updateData.experience;
    }

    if (updateData.fee) {
      updates.fee = typeof updateData.fee === 'string'
        ? parseFloat(updateData.fee.replace(/[^0-9.]/g, ''))
        : updateData.fee;
    }

    // Update other fields
    if (updateData.name) updates.name = updateData.name;
    if (updateData.rating !== undefined) updates.rating = updateData.rating;
    if (updateData.email) updates.email = updateData.email;
    if (updateData.phone) updates.phone = updateData.phone;
    if (updateData.qualification !== undefined) updates.qualification = updateData.qualification;
    if (updateData.bio !== undefined) updates.bio = updateData.bio;
    if (updateData.image !== undefined) updates.image = updateData.image;
    if (updateData.consultationDuration) updates.consultation_duration = updateData.consultationDuration;

    await doctor.update(updates);

    // Fetch updated doctor with associations
    const updatedDoctor = await Doctor.findByPk(id, {
      include: [
        { model: Specialization, as: 'specialization' },
        { model: Hospital, as: 'hospital' },
        { model: DoctorAvailability, as: 'availabilities' }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: formatDoctorForFrontend(updatedDoctor)
    });

  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating doctor',
      error: error.message
    });
  }
};

// DELETE doctor
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByPk(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    await doctor.destroy();

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting doctor',
      error: error.message
    });
  }
};