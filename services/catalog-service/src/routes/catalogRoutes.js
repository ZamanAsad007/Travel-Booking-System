import { Router } from 'express';
import { z } from 'zod';
import { catalogController } from '../controllers/catalogController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

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

const flightCreateSchema = z.object({
  flight_number: z.string().min(1, 'Flight number is required'),
  airline: z.string().min(1, 'Airline is required'),
  origin: z.string().min(2, 'Origin is required'),
  destination: z.string().min(2, 'Destination is required'),
  departs_at: z.string().datetime().or(z.string().min(5)),
  arrives_at: z.string().datetime().or(z.string().min(5)),
  price: z.number().positive('Price must be greater than 0'),
  seats_total: z.number().int().positive('Seats must be greater than 0'),
});

const hotelCreateSchema = z.object({
  name: z.string().min(1, 'Hotel name is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional(),
  image_url: z.string().optional().nullable(),
});

const roomCreateSchema = z.object({
  type: z.string().min(1, 'Room type is required'),
  price_per_night: z.number().positive('Price per night must be positive'),
  rooms_total: z.number().int().positive('Total rooms must be positive'),
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

// Admin Inventory Endpoints (CRUD)
const adminAuth = [authenticate, requireRole('ADMIN')];

router.post('/flights', adminAuth, validate(flightCreateSchema), catalogController.createFlight);
router.put('/flights/:id', adminAuth, catalogController.updateFlight);
router.delete('/flights/:id', adminAuth, catalogController.deleteFlight);

router.post('/hotels', adminAuth, validate(hotelCreateSchema), catalogController.createHotel);
router.put('/hotels/:id', adminAuth, catalogController.updateHotel);
router.delete('/hotels/:id', adminAuth, catalogController.deleteHotel);

router.post(
  '/hotels/:hotelId/rooms',
  adminAuth,
  validate(roomCreateSchema),
  catalogController.createRoom
);
router.put('/rooms/:id', adminAuth, catalogController.updateRoom);
router.delete('/rooms/:id', adminAuth, catalogController.deleteRoom);

// Aliases with /admin/ prefix for convenience
router.post(
  '/admin/flights',
  adminAuth,
  validate(flightCreateSchema),
  catalogController.createFlight
);
router.put('/admin/flights/:id', adminAuth, catalogController.updateFlight);
router.delete('/admin/flights/:id', adminAuth, catalogController.deleteFlight);
router.post('/admin/hotels', adminAuth, validate(hotelCreateSchema), catalogController.createHotel);
router.put('/admin/hotels/:id', adminAuth, catalogController.updateHotel);
router.delete('/admin/hotels/:id', adminAuth, catalogController.deleteHotel);
router.post(
  '/admin/hotels/:hotelId/rooms',
  adminAuth,
  validate(roomCreateSchema),
  catalogController.createRoom
);
router.put('/admin/rooms/:id', adminAuth, catalogController.updateRoom);
router.delete('/admin/rooms/:id', adminAuth, catalogController.deleteRoom);

export default router;
