import app from './app.js';
import { config } from './config/env.js';
import { pool } from './config/db.js';
import { runMigrations } from './migrations/migrate.js';

async function waitForDb(retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[auth-service] Connected to PostgreSQL database.');
      return;
    } catch (err) {
      console.log(`[auth-service] Database connection attempt ${i + 1}/${retries} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('[auth-service] Could not connect to PostgreSQL after multiple attempts.');
}

async function startServer() {
  try {
    await waitForDb();
    await runMigrations();

    const server = app.listen(config.port, () => {
      console.log(`[auth-service] Running on port ${config.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`[auth-service] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await pool.end();
        console.log('[auth-service] Closed database connections and stopped server.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[auth-service] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
