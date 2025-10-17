const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,               // Certo: 'db'
    user: process.env.POSTGRES_USER,         // Correção: Usar POSTGRES_USER
    password: process.env.POSTGRES_PASSWORD, // Correção: Usar POSTGRES_PASSWORD
    database: process.env.POSTGRES_DB,       // Correção: Usar POSTGRES_DB
    port: 5432,                              // Correção: Porta fixa para simplicidade
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};