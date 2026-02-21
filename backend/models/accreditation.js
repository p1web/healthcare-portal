module.exports = (sequelize, DataTypes) => {
  const Accreditation = sequelize.define(
    "Accreditation",
    {
      name: DataTypes.STRING,
      full_name: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    {
      tableName: "accreditations",
      underscored: true,
      timestamps: false,  
    }
  );

  Accreditation.associate = (models) => {
    Accreditation.belongsToMany(models.Hospital, {
      through: models.HospitalAccreditation,
      foreignKey: "accreditation_id",
      as: "hospitals",
    });
  };

  return Accreditation;
};
