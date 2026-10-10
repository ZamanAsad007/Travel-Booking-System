import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[booking-service] Running database migrations...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const files = fs
      .readdirSync(__dirname)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const sqlFile = path.join(__dirname, file);
      const sql = fs.readFileSync(sqlFile, 'utf8');
      await client.query(sql);
      console.log(`[booking-service] Applied migration ${file}`);
    }
    await client.query('COMMIT');
    console.log('[booking-service] Migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[booking-service] Migration failed:', err);
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
