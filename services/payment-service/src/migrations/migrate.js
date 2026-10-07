import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[payment-service] Running database migrations...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sqlFile = path.join(__dirname, '001_create_payment_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[payment-service] Migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[payment-service] Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1] === __filename) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
