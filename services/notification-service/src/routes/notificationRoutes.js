import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Live SSE event stream
router.get('/stream/bookings', authenticate, notificationController.streamBookings);
router.get('/stream', authenticate, notificationController.streamBookings);

router.get('/tickets/:ticketNumber/download', notificationController.downloadTicket);
router.get('/tickets/:ticketNumber', notificationController.downloadTicket);
router.get('/', notificationController.listNotifications);
router.get('/:id', notificationController.getById);

export default router;
