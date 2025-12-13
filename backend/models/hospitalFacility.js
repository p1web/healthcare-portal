module.exports = (sequelize, DataTypes) => {
  const HospitalFacility = sequelize.define(
    "HospitalFacility",
    {
      available_24x7: DataTypes.BOOLEAN,
    },
    {
      tableName: "hospital_facilities",
      underscored: true,
    }
  );

  HospitalFacility.associate = (models) => {
    HospitalFacility.belongsTo(models.Hospital, {
      foreignKey: "hospital_id",
    });
    HospitalFacility.belongsTo(models.Facility, {
      foreignKey: "facility_id",
    });
  };

  return HospitalFacility;
};
