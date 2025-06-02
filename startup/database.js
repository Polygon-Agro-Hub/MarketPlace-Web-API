const mysql = require("mysql2");
require("dotenv").config();

const admin = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_AD,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 6,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const plantcare = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_PC,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 6,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const collectionofficer = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_CO,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 6,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const marketPlace = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_MP,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 6,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// const dash = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME_DS,
//   port: process.env.DB_PORT,
//   charset: "utf8mb4",
//   waitForConnections: true,
//   connectionLimit: 10,
//   maxIdle: 6,
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0,
// });

module.exports = { admin, plantcare, collectionofficer, marketPlace, /*dash*/ };
