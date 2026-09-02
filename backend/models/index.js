const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Specialty = require("./specialty")(sequelize, DataTypes);
const Facility = require("./facility")(sequelize, DataTypes);
const Accreditation = require("./accreditation")(sequelize, DataTypes);
const Specialization = require("./specialization")(sequelize, DataTypes);
const Qualification = require("./qualification")(sequelize, DataTypes);
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
const PatientAllergy = require("./patient-allergy")(sequelize, DataTypes);
const PatientMedicalCondition = require("./patient-medical-condition")(sequelize, DataTypes);
const DoctorPractice = require("./doctor-practice")(sequelize, DataTypes);
const PlatformCommissionSettings = require("./platform-commission-settings")(sequelize, DataTypes);
const HospitalStaff = require("./hospital-staff")(sequelize, DataTypes);
const HospitalAvailability = require("./hospital-availability")(sequelize, DataTypes);
const Department = require("./department")(sequelize, DataTypes);
const HospitalStaffAvailability = require("./hospital-staff-availability")(sequelize, DataTypes);


// Run associations
Specialization.associate({ DoctorProfile });
DoctorAvailability.associate({ DoctorProfile, DoctorPractice });

Coupon.associate({ CouponCategory, HospitalProfile, CouponUsage });
CouponCategory.associate({ Coupon });
CouponUsage.associate({ Coupon });
Appointment.associate({ DoctorProfile, User, Coupon, DoctorPractice, HospitalProfile, HospitalStaff, Department });

// User associations
User.associate({ PatientProfile, DoctorProfile, HospitalProfile });

// Profile associations
PatientProfile.associate({ User, PatientAllergy, PatientMedicalCondition });
DoctorProfile.associate({ User, Specialization, DoctorAvailability, Appointment, DoctorPractice });
HospitalProfile.associate({ User, Coupon, DoctorPractice, HospitalStaff, HospitalAvailability, Department });
PatientAllergy.associate({ PatientProfile });
PatientMedicalCondition.associate({ PatientProfile });
DoctorPractice.associate({ DoctorProfile, HospitalProfile, DoctorAvailability, Appointment });
PlatformCommissionSettings.associate({ User });
HospitalStaff.associate({ HospitalProfile, Department, HospitalStaffAvailability, Appointment });
HospitalAvailability.associate({ HospitalProfile });
Department.associate({ HospitalProfile, HospitalStaff, Appointment });
HospitalStaffAvailability.associate({ HospitalStaff });


module.exports = {
  sequelize,
  Specialty,
  Facility,
  Accreditation,
  Specialization,
  Qualification,
  DoctorAvailability,
  Coupon,
  CouponCategory,
  CouponUsage,
  Appointment,

  // User authentication models
  User,
  PatientProfile,
  DoctorProfile,
  HospitalProfile,
  PatientAllergy,
  PatientMedicalCondition,
  DoctorPractice,
  PlatformCommissionSettings,
  HospitalStaff,
  HospitalAvailability,
  Department,
  HospitalStaffAvailability
};
