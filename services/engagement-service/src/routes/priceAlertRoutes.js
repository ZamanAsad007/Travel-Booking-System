import { Router } from 'express';
import { priceAlertController } from '../controllers/priceAlertController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', priceAlertController.getAlerts);
router.post('/', priceAlertController.createAlert);
router.delete('/:id', priceAlertController.deleteAlert);

export default router;
