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

// Run associations
Hospital.associate({ Specialty, Facility, Accreditation, HospitalImage, HospitalSpecialty, HospitalFacility, HospitalAccreditation });
Specialty.associate({ Hospital, HospitalSpecialty });
Facility.associate({ Hospital, HospitalFacility });
Accreditation.associate({ Hospital, HospitalAccreditation });
HospitalImage.associate({ Hospital });
HospitalSpecialty.associate({ Hospital, Specialty });
HospitalFacility.associate({ Hospital, Facility });
HospitalAccreditation.associate({ Hospital, Accreditation });

module.exports = {
  sequelize,
  Hospital,
  Specialty,
  Facility,
  Accreditation,
  HospitalImage,
  HospitalSpecialty,
  HospitalFacility,
  HospitalAccreditation
};
