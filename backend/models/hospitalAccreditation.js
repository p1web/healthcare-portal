module.exports = (sequelize, DataTypes) => {
  const HospitalAccreditation = sequelize.define(
    "HospitalAccreditation",
    {
      certified_date: DataTypes.DATEONLY,
      expiry_date: DataTypes.DATEONLY,
      certificate_number: DataTypes.STRING,
    },
    {
      tableName: "hospital_accreditations",
      underscored: true,
    }
  );

  HospitalAccreditation.associate = (models) => {
    HospitalAccreditation.belongsTo(models.Hospital, {
      foreignKey: "hospital_id",
    });
    HospitalAccreditation.belongsTo(models.Accreditation, {
      foreignKey: "accreditation_id",
    });
  };

  return HospitalAccreditation;
};
