const { Sequelize } = require("sequelize");
const { activityContext } = require("../utils/activityContext");
const { sanitizeSqlQuery } = require("../utils/activitySanitizers");

const sequelize = new Sequelize(
  process.env.DB_NAME || "healthcare_db",
  process.env.DB_USER || "healthcare_user",
  process.env.DB_PASSWORD || "healthcare_pass",
  {
    host: process.env.DB_HOST || "postgres",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: (sql) => {
      const context = activityContext.getStore();
      if (!context) return;

      if (context.sqlQueries.length < 50) {
        context.sqlQueries.push(sanitizeSqlQuery(sql));
      } else {
        context.sqlQueriesTruncated = true;
      }
    },
  }
);

module.exports = sequelize;
