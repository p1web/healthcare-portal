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
      timestamps: false,
    }
  );

  return Facility;
};
