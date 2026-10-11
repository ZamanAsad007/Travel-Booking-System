import { Router } from 'express';
import { successResponse } from '../../../../shared/utils/response.js';

const router = Router();

router.get('/health', (req, res) => {
  return successResponse(res, {
    service: 'engagement-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
