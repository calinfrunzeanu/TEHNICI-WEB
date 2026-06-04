const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "pethub_user",
  password: process.env.MYSQL_PASSWORD || "PethubPass123!",
  database: process.env.MYSQL_DATABASE || "pethub",
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

module.exports = {
  query: function (sql, params) {
    return pool.execute(sql, params);
  },
  getConnection: function () {
    return pool.getConnection();
  }
};
