module.exports = (sequelize, DataTypes) => {
  const HospitalSpecialty = sequelize.define(
    "HospitalSpecialty",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, },
      is_primary: DataTypes.BOOLEAN,
    },
    {
      tableName: "hospital_specialties",
      underscored: true,
      createdAt: "created_at",
      updatedAt: false,
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
