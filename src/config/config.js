require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "your_password",
    database: process.env.DATABASE_NAME || "costume_rental",
    host: process.env.DATABASE_HOST || "localhost",
    port: process.env.DATABASE_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
  test: {
    username: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "your_password",
    database: process.env.DATABASE_NAME || "costume_rental",
    host: process.env.DATABASE_HOST || "localhost",
    port: process.env.DATABASE_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
  production: {
    username: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "your_password",
    database: process.env.DATABASE_NAME || "costume_rental",
    host: process.env.DATABASE_HOST || "localhost",
    port: process.env.DATABASE_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
};
