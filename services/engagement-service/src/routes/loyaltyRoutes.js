import { Router } from 'express';
import { loyaltyController } from '../controllers/loyaltyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/me', authMiddleware, loyaltyController.getMyLoyalty);
router.get('/ledger', authMiddleware, loyaltyController.getLedger);

export default router;
