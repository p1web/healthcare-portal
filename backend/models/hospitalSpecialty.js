module.exports = (sequelize, DataTypes) => {
  const HospitalSpecialty = sequelize.define(
    "HospitalSpecialty",
    {
      is_primary: DataTypes.BOOLEAN,
    },
    {
      tableName: "hospital_specialties",
      underscored: true,
    }
  );

  HospitalSpecialty.associate = (models) => {
    HospitalSpecialty.belongsTo(models.Hospital, {
      foreignKey: "hospital_id",
    });
    HospitalSpecialty.belongsTo(models.Specialty, {
      foreignKey: "specialty_id",
    });
  };

  return HospitalSpecialty;
};
