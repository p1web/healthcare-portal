const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Hospital = require("./hospital")(sequelize, DataTypes);
const Specialty = require("./specialty")(sequelize, DataTypes);
const Facility = require("./facility")(sequelize, DataTypes);
const Accreditation = require("./accreditation")(sequelize, DataTypes);
const HospitalImage = require("./hospitalImage")(sequelize, DataTypes);
const HospitalSpecialty = require("./hospitalSpecialty")(sequelize, DataTypes);
const HospitalFacility = require("./hospitalFacility")(sequelize, DataTypes);
const HospitalAccreditation = require("./hospitalAccreditation")(sequelize, DataTypes);
const Doctor = require("./doctor")(sequelize, DataTypes);
const Specialization = require("./specialization")(sequelize, DataTypes);
const DoctorAvailability = require("./doctorAvailability")(sequelize, DataTypes);

const Coupon = require("./coupon")(sequelize, DataTypes);
const CouponCategory = require("./coupon-category")(sequelize, DataTypes);
const CouponUsage = require("./coupon-usage")(sequelize, DataTypes);
const Appointment = require("./appointment")(sequelize, DataTypes);

// User authentication models
const User = require("./user")(sequelize, DataTypes);
const PatientProfile = require("./patient-profile")(sequelize, DataTypes);
const DoctorProfile = require("./doctor-profile")(sequelize, DataTypes);
const HospitalProfile = require("./hospital-profile")(sequelize, DataTypes);


// Run associations
Hospital.associate({ Specialty, Facility, Accreditation, HospitalImage, HospitalSpecialty, HospitalFacility, HospitalAccreditation });
Specialty.associate({ Hospital, HospitalSpecialty });
Facility.associate({ Hospital, HospitalFacility });
Accreditation.associate({ Hospital, HospitalAccreditation });
HospitalImage.associate({ Hospital });
HospitalSpecialty.associate({ Hospital, Specialty });
HospitalFacility.associate({ Hospital, Facility });
HospitalAccreditation.associate({ Hospital, Accreditation });
Doctor.associate({ DoctorProfile, Specialization, Hospital, DoctorAvailability });
Specialization.associate({ Doctor });
DoctorAvailability.associate({ Doctor });

Coupon.associate({ CouponCategory, Hospital, CouponUsage });
CouponCategory.associate({ Coupon });
CouponUsage.associate({ Coupon });
Appointment.associate({ Doctor, User });

// User associations
User.associate({ PatientProfile, DoctorProfile, HospitalProfile });

// Profile associations
PatientProfile.associate({ User });
DoctorProfile.associate({ User, Doctor, Specialization });
HospitalProfile.associate({ User, Hospital });


module.exports = {
  sequelize,
  Hospital,
  Specialty,
  Facility,
  Accreditation,
  HospitalImage,
  HospitalSpecialty,
  HospitalFacility,
  HospitalAccreditation,
  Doctor,
  Specialization,
  DoctorAvailability,
  Coupon,
  CouponCategory,
  CouponUsage,
  Appointment,

  // User authentication models
  User,
  PatientProfile,
  DoctorProfile,
  HospitalProfile
};
