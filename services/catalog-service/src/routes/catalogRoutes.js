import { Router } from 'express';
import { z } from 'zod';
import { catalogController } from '../controllers/catalogController.js';
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

const availabilitySchema = z.object({
  itemType: z.preprocess(normalizeItemType, z.enum(['flight', 'hotel'])),
  itemId: z.string().uuid('Invalid item UUID'),
  quantity: z.number().int().positive().optional().default(1),
});

const holdSchema = z.object({
  itemType: z.preprocess(normalizeItemType, z.enum(['flight', 'hotel'])),
  itemId: z.string().uuid('Invalid item UUID'),
  bookingId: z.string().uuid('Invalid booking UUID'),
  quantity: z.number().int().positive().optional().default(1),
  ttlSeconds: z.number().int().positive().optional().default(600),
});

const reserveSchema = z.object({
  itemType: z.preprocess(normalizeItemType, z.enum(['flight', 'hotel'])),
  itemId: z.string().uuid('Invalid item UUID'),
  bookingId: z.string().uuid('Invalid booking UUID'),
  quantity: z.number().int().positive().optional().default(1),
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
});

// Search & details
router.get('/flights', catalogController.searchFlights);
router.get('/flights/:id', catalogController.getFlight);
router.get('/hotels', catalogController.searchHotels);
router.get('/hotels/:id', catalogController.getHotel);

// Inventory holds (Redis TTL)
router.post('/holds', validate(holdSchema), catalogController.createHold);
router.delete('/holds/:bookingId', catalogController.releaseHolds);
router.post('/holds/:bookingId/confirm', catalogController.confirmHold);

// Internal availability and direct reservation endpoints
router.post(
  '/check-availability',
  validate(availabilitySchema),
  catalogController.checkAvailability
);
router.post('/reserve', validate(reserveSchema), catalogController.reserveItem);
router.post('/reservations/:bookingId/release', catalogController.releaseReservation);

export default router;
