import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';

const router = Router();

router.get('/:bookingId', paymentController.getByBookingId);

export default router;
