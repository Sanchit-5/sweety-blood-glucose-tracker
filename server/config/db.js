const { Pool, types } = require("pg");
require("dotenv").config();
// Return PostgreSQL DATE values as YYYY-MM-DD strings
types.setTypeParser(1082, (value) => value);


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});

module.exports = pool;