import { Router } from 'express';
import { z } from 'zod';
import { bookingController } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const bookingItemSchema = z.object({
  itemType: z.enum(['flight', 'hotel']),
  itemId: z.string().uuid('Invalid item UUID'),
  quantity: z.number().int().positive().default(1),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const createBookingSchema = z.object({
  items: z.array(bookingItemSchema).min(1, 'At least one item is required in the booking'),
});

// All booking endpoints require authentication
router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.create);
router.get('/', bookingController.list);
router.get('/:id', bookingController.getById);
router.post('/:id/cancel', bookingController.cancel);

export default router;
