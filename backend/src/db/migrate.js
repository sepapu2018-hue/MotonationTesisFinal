// Aplica el schema.sql sobre la base de datos. Idempotente (todos los CREATE usan IF NOT EXISTS).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

(async () => {
  // Conseguimos un cliente único del pool para asegurar la conexión directa
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    // Al usar client.query(sql) directo, Postgres procesa todo el archivo nativamente
    await client.query(sql);
    
    console.log('[migrate] schema aplicado correctamente');
    process.exit(0);
  } catch (e) {
    console.error('[migrate] error:', e.message);
    process.exit(1);
  } finally {
    // Liberamos el cliente de vuelta al pool
    client.release();
  }
})();