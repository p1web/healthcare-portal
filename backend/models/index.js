const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Specialty = require("./specialty")(sequelize, DataTypes);
const Facility = require("./facility")(sequelize, DataTypes);
const Accreditation = require("./accreditation")(sequelize, DataTypes);
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
const PatientAllergy = require("./patient-allergy")(sequelize, DataTypes);
const PatientMedicalCondition = require("./patient-medical-condition")(sequelize, DataTypes);


// Run associations
Specialization.associate({ DoctorProfile });
DoctorAvailability.associate({ DoctorProfile });

Coupon.associate({ CouponCategory, HospitalProfile, CouponUsage });
CouponCategory.associate({ Coupon });
CouponUsage.associate({ Coupon });
Appointment.associate({ DoctorProfile, User, Coupon });

// User associations
User.associate({ PatientProfile, DoctorProfile, HospitalProfile });

// Profile associations
PatientProfile.associate({ User, PatientAllergy, PatientMedicalCondition });
DoctorProfile.associate({ User, Specialization, HospitalProfile, DoctorAvailability, Appointment });
HospitalProfile.associate({ User, DoctorProfile, Coupon });
PatientAllergy.associate({ PatientProfile });
PatientMedicalCondition.associate({ PatientProfile });


module.exports = {
  sequelize,
  Specialty,
  Facility,
  Accreditation,
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
  HospitalProfile,
  PatientAllergy,
  PatientMedicalCondition
};
