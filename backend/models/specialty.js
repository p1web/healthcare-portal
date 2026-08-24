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

  return Specialty;
};
