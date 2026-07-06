// Backup manual de la base de datos: exporta todas las tablas del esquema
// public a un archivo JSON con timestamp en backend/backups/.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function backup() {
  const { rows: tables } = await pool.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `);

  const dump = {};
  for (const { tablename } of tables) {
    const { rows } = await pool.query(`SELECT * FROM "${tablename}"`);
    dump[tablename] = rows;
  }

  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(dir, `backup_${stamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dump, null, 2));

  const tableCount = Object.keys(dump).length;
  const rowCount = Object.values(dump).reduce((sum, rows) => sum + rows.length, 0);
  console.log(`Backup guardado en ${filePath}`);
  console.log(`${tableCount} tablas, ${rowCount} filas en total.`);
}

backup()
  .catch((err) => {
    console.error('Error al hacer backup:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
