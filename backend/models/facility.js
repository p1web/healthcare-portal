module.exports = (sequelize, DataTypes) => {
  const Facility = sequelize.define(
    "Facility",
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      icon: DataTypes.STRING,
    },
    {
      tableName: "facilities",
      underscored: true,
    }
  );

  Facility.associate = (models) => {
    Facility.belongsToMany(models.Hospital, {
      through: models.HospitalFacility,
      foreignKey: "facility_id",
      as: "hospitals",
    });
  };

  return Facility;
};
