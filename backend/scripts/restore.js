// Restaura un backup generado por backup.js.
// Uso: node scripts/restore.js backups/backup_2026-07-04T12-00-00-000Z.json
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function restore() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Uso: node scripts/restore.js <ruta-al-backup.json>');
    process.exitCode = 1;
    return;
  }

  const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(__dirname, '..', fileArg);
  const dump = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const tables = Object.keys(dump);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Desactiva temporalmente triggers y validacion de FKs para poder
    // truncar/insertar sin importar el orden de dependencias entre tablas.
    await client.query("SET session_replication_role = 'replica'");

    for (const table of tables) {
      await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
    }

    for (const table of tables) {
      const { rows: cols } = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      const jsonColumns = new Set(
        cols.filter((c) => c.data_type === 'json' || c.data_type === 'jsonb').map((c) => c.column_name)
      );

      const rows = dump[table];
      for (const row of rows) {
        const columns = Object.keys(row);
        if (columns.length === 0) continue;
        // pg no serializa objetos JS automaticamente para columnas json/jsonb,
        // hay que convertirlos a texto o falla con "invalid input syntax for type json".
        const values = columns.map((c) =>
          jsonColumns.has(c) && row[c] !== null ? JSON.stringify(row[c]) : row[c]
        );
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnList = columns.map((c) => `"${c}"`).join(', ');
        await client.query(
          `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders})`,
          values
        );
      }

      // Las columnas SERIAL/IDENTITY no avanzan su secuencia con INSERTs
      // explicitos de id, hay que resincronizarla o el siguiente insert
      // real puede chocar con una clave duplicada.
      for (const { column_name } of cols) {
        const { rows: seqRows } = await client.query(
          'SELECT pg_get_serial_sequence($1, $2) AS seq',
          [table, column_name]
        );
        const seq = seqRows[0]?.seq;
        if (seq) {
          await client.query(
            `SELECT setval($1, COALESCE((SELECT MAX("${column_name}") FROM "${table}"), 1), (SELECT MAX("${column_name}") FROM "${table}") IS NOT NULL)`,
            [seq]
          );
        }
      }
    }

    await client.query("SET session_replication_role = 'origin'");
    await client.query('COMMIT');
    console.log(`Restauradas ${tables.length} tablas desde ${filePath}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

restore()
  .catch((err) => {
    console.error('Error al restaurar:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
