const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'loja',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'lojadecartas',
    port: process.env.DB_PORT || 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};