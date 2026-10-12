import app from './app.js';
import { config } from './config/env.js';
import { pool } from './config/db.js';
import { runMigrations } from './migrations/migrate.js';
import { startEngagementConsumer } from './events/engagementConsumer.js';

import pg from 'pg';
const { Client } = pg;

async function ensureDatabase() {
  const adminClient = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      config.db.database,
    ]);
    if (res.rowCount === 0) {
      console.log(
        `[engagement-service] Database "${config.db.database}" does not exist. Creating...`
      );
      const safeDbName = config.db.database.replace(/[^a-zA-Z0-9_]/g, '');
      await adminClient.query(`CREATE DATABASE "${safeDbName}"`);
      console.log(`[engagement-service] Database "${safeDbName}" created successfully.`);
    }
  } catch (err) {
    console.error('[engagement-service] Failed to ensure database exists:', err.message);
  } finally {
    await adminClient.end().catch(() => {});
  }
}

async function waitForDb(retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[engagement-service] Connected to PostgreSQL database.');
      return;
    } catch (err) {
      if (err.code === '3D000' || err.message?.includes('does not exist')) {
        console.log(
          `[engagement-service] Database "${config.db.database}" missing, attempting auto-creation...`
        );
        await ensureDatabase();
      }
      console.log(
        `[engagement-service] Database connection attempt ${i + 1}/${retries} failed: ${err.message}. Retrying in ${delay / 1000}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('[engagement-service] Could not connect to PostgreSQL after multiple attempts.');
}

async function startServer() {
  try {
    await waitForDb();
    await runMigrations();

    const server = app.listen(config.port, () => {
      console.log(`[engagement-service] Running on port ${config.port}`);
    });

    // Start background event consumer
    startEngagementConsumer().catch((err) => {
      console.error('[engagement-service] Error starting event consumer:', err.message);
    });

    const shutdown = async (signal) => {
      console.log(`[engagement-service] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await pool.end();
        console.log('[engagement-service] Closed database connections and stopped server.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[engagement-service] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
