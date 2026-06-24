// Pool de conexiones a PostgreSQL — una sola instancia compartida en toda la app
const { Pool } = require('pg');

let poolConfig;

// Si existe la URL completa de producción (Supabase), la usamos directamente
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
  };
} else {
  // Si estamos en local (pgAdmin), pasamos las credenciales ordenadas como objeto individual
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root1253',
    database: process.env.DB_NAME || 'motonation-final',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[pg] error inesperado en cliente inactivo:', err.message);
});

// Helpers para queries — devuelven directamente las filas
async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

async function one(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

module.exports = { pool, query, one };