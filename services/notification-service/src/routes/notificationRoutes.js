import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';

const router = Router();

router.get('/tickets/:ticketNumber/download', notificationController.downloadTicket);
router.get('/tickets/:ticketNumber', notificationController.downloadTicket);
router.get('/', notificationController.listNotifications);
router.get('/:id', notificationController.getById);

export default router;
