import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';

const router = Router();

router.get('/', notificationController.listNotifications);
router.get('/:id', notificationController.getById);

export default router;
