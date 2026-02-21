module.exports = (sequelize, DataTypes) => {
  const Hospital = sequelize.define(
    "Hospital",
    {
      name: DataTypes.STRING,
      location: DataTypes.STRING,
      address: DataTypes.TEXT,
      phone: DataTypes.STRING,
      email: DataTypes.STRING,
      rating: DataTypes.DECIMAL,
      discount: DataTypes.STRING,
      description: DataTypes.TEXT,
      beds: DataTypes.INTEGER,
      established: DataTypes.INTEGER,
      operating_hours: DataTypes.STRING,
      emergency_available: DataTypes.BOOLEAN,
      ambulance_available: DataTypes.BOOLEAN,
      registration_number: { 
        type: DataTypes.STRING(50), 
        allowNull: true, 
        unique: true, 
      }, 
      hospital_type: { 
        type: DataTypes.ENUM("private", "government", "charity", "clinic"), 
        allowNull: true,  
      }, 
      is_published: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
      },
      verification_documents: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue("verification_documents");
          return rawValue ? Array.isArray(rawValue) ? rawValue : JSON.parse(rawValue) : [];
        },
      },
    },
    {
      tableName: "hospitals",
      underscored: true,
    }
  );

  Hospital.associate = (models) => {
    Hospital.hasMany(models.HospitalImage, {
      foreignKey: "hospital_id",
      as: "images",
    });

    Hospital.belongsToMany(models.Specialty, {
      through: models.HospitalSpecialty,
      foreignKey: "hospital_id",
      as: "specialties",
    });

    Hospital.belongsToMany(models.Facility, {
      through: models.HospitalFacility,
      foreignKey: "hospital_id",
      as: "facilities",
    });

    Hospital.belongsToMany(models.Accreditation, {
      through: models.HospitalAccreditation,
      foreignKey: "hospital_id",
      as: "accreditations",
    });
  };

  return Hospital;
};
