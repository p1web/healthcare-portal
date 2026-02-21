module.exports = (sequelize, DataTypes) => {
  const HospitalImage = sequelize.define(
    "HospitalImage",
    {
      image_url: DataTypes.TEXT,
      image_type: DataTypes.ENUM(
        "main",
        "gallery",
        "facility",
        "exterior",
        "interior"
      ),
      title: DataTypes.STRING,
      description: DataTypes.TEXT,
      display_order: DataTypes.INTEGER,
      is_primary: DataTypes.BOOLEAN,
    },
    {
      tableName: "hospital_images",
      underscored: true,
      timestamps: false,
    }
  );

  HospitalImage.associate = (models) => {
    HospitalImage.belongsTo(models.Hospital, {
      foreignKey: "hospital_id",
    });
  };

  return HospitalImage;
};
