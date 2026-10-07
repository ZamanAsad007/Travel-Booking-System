import app from './app.js';
import { config } from './config/env.js';
import { pool } from './config/db.js';
import { runMigrations } from './migrations/migrate.js';
import { seedCatalogData } from './seeds/seed.js';

async function waitForDb(retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[catalog-service] Connected to PostgreSQL database.');
      return;
    } catch (err) {
      console.log(`[catalog-service] Database connection attempt ${i + 1}/${retries} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('[catalog-service] Could not connect to PostgreSQL after multiple attempts.');
}

async function startServer() {
  try {
    await waitForDb();
    await runMigrations();
    await seedCatalogData();

    const server = app.listen(config.port, () => {
      console.log(`[catalog-service] Running on port ${config.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`[catalog-service] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await pool.end();
        console.log('[catalog-service] Closed database connections and stopped server.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[catalog-service] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
