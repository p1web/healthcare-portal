module.exports = (sequelize, DataTypes) => {
  const Specialty = sequelize.define(
    "Specialty",
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      icon: DataTypes.STRING,
    },
    {
      tableName: "specialties",
      underscored: true,
      timestamps: false,
    }
  );

  Specialty.associate = (models) => {
    Specialty.belongsToMany(models.Hospital, {
      through: models.HospitalSpecialty,
      foreignKey: "specialty_id",
      as: "hospitals",
    });
  };

  return Specialty;
};
