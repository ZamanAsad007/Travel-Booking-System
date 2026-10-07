import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[auth-service] Running database migrations...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sqlFile = path.join(__dirname, '001_create_users_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[auth-service] Migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[auth-service] Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow direct execution
if (process.argv[1] === __filename) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
