import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'notification-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
});

export default router;
