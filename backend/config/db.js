const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "healthcare_db",
  process.env.DB_USER || "healthcare_user",
  process.env.DB_PASSWORD || "healthcare_pass",
  {
    host: process.env.DB_HOST || "postgres",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

module.exports = sequelize;
