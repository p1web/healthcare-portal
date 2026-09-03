const { Op } = require('sequelize');
const { HospitalProfile, User, Specialty } = require('../models');
const { PROFILE_REVIEW_STATUSES } = require('./providerReview');

const publicHospitalIncludes = [{
  model: User,
  as: 'user',
  required: true,
  where: { isActive: true, isBlocked: false },
  attributes: ['id', 'name', 'email', 'phone', 'profileImage']
}, {
  model: User,
  as: 'reviewedBy',
  required: false,
  attributes: ['id', 'name', 'email']
}];

async function attachSpecialties(profiles) {
  const specialtyIds = [...new Set(profiles.flatMap(profile => profile.specialtyIds || []))];
  const specialties = specialtyIds.length
    ? await Specialty.findAll({ where: { id: { [Op.in]: specialtyIds } }, attributes: ['id', 'name', 'description'] })
    : [];
  const specialtyMap = new Map(specialties.map(specialty => [specialty.id, specialty.toJSON()]));

  return profiles.map(profile => ({
    profile,
    specialties: (profile.specialtyIds || []).map(id => specialtyMap.get(Number(id))).filter(Boolean)
  }));
}

async function findPublicHospitalProfiles(options = {}) {
  const profiles = await HospitalProfile.findAll({
    where: {
      verificationStatus: PROFILE_REVIEW_STATUSES.APPROVED,
      ...(options.id ? { id: options.id } : {})
    },
    include: publicHospitalIncludes,
    order: [['lastVerifiedAt', 'DESC']]
  });
  return attachSpecialties(profiles);
}

function formatPublicHospital({ profile, specialties }) {
  const data = profile.toJSON();
  const publishedProfileImage = data.profileImagePublished ? data.profileImageUrl : null;
  const publishedBannerImage = data.bannerImagePublished ? data.bannerImageUrl : null;
  return {
    id: data.id,
    name: data.hospitalName,
    location: [data.hospitalCity, data.hospitalState].filter(Boolean).join(', '),
    address: data.hospitalAddress,
    phone: data.hospitalPhone,
    email: data.hospitalEmail,
    emergencyContactNumber: data.emergencyContactNumber,
    website: data.website,
    rating: Number(data.rating || 0),
    discount: data.discount || null,
    description: data.bio || '',
    beds: data.totalBeds,
    established: data.establishedYear,
    operatingHours: data.operatingHours,
    emergencyAvailable: !!data.emergencyServices,
    ambulanceAvailable: !!data.ambulanceServices,
    specialties: specialties.map(specialty => specialty.name),
    facilities: [],
    accreditations: [],
    image: publishedProfileImage || data.user?.profileImage || null,
    profileImage: publishedProfileImage,
    bannerImage: publishedBannerImage,
    images: [],
    registrationNumber: data.registrationNumber,
    hospitalType: data.hospitalType,
    defaultConsultationFee: data.defaultConsultationFee !== null && data.defaultConsultationFee !== undefined
      ? parseFloat(data.defaultConsultationFee) : null
  };
}

module.exports = { findPublicHospitalProfiles, formatPublicHospital };