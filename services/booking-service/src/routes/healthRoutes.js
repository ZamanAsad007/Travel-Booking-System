import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  res.status(dbStatus === 'connected' ? 200 : 503).json({
    success: true,
    data: {
      service: 'booking-service',
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
});

export default router;
