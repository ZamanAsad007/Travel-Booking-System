import { Router } from 'express';
import { z } from 'zod';
import { bookingController } from '../controllers/bookingController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const normalizeItemType = (val) => {
  if (typeof val !== 'string') return val;
  const lower = val.toLowerCase().trim();
  if (lower === 'flight' || lower === 'flights') return 'flight';
  if (
    lower === 'hotel' ||
    lower === 'hotels' ||
    lower === 'hotel_room' ||
    lower === 'hotel-room' ||
    lower === 'room'
  ) {
    return 'hotel';
  }
  return lower;
};

const bookingItemSchema = z.object({
  itemType: z.preprocess(normalizeItemType, z.enum(['flight', 'hotel'])),
  itemId: z.string().uuid('Invalid item UUID'),
  quantity: z.number().int().positive().default(1),
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
});

const travelerSchema = z.object({
  full_name: z.string().min(1, 'Traveler full name is required'),
  passport_no: z.string().min(1, 'Passport number is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  seat_no: z.string().optional().nullable(),
});

const createBookingSchema = z.object({
  items: z.array(bookingItemSchema).min(1, 'At least one item is required in the booking'),
  travelers: z.array(travelerSchema).min(1, 'At least one traveler is required').optional(),
});

// All booking endpoints require authentication
router.use(authenticate);

// Admin endpoints
router.get('/admin/all', requireRole('ADMIN'), bookingController.adminListAll);
router.get('/admin/stats', requireRole('ADMIN'), bookingController.getStats);

router.post('/', validate(createBookingSchema), bookingController.create);
router.get('/', bookingController.list);
router.get('/:id/ticket/download', bookingController.downloadTicketPdf);
router.get('/:id/ticket', bookingController.getTicket);
router.get('/:id', bookingController.getById);
router.post('/:id/cancel', bookingController.cancel);

export default router;
