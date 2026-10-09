import request from 'supertest';
import { jest } from '@jest/globals';
import { pool as bookingPool } from '../../services/booking-service/src/config/db.js';
import app from '../../services/booking-service/src/app.js';

describe('Booking Service API Tests', () => {
  beforeAll(() => {
    jest
      .spyOn(bookingPool, 'query')
      .mockImplementation(async () => ({ rows: [{ '?column?': 1 }] }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  describe('GET /health', () => {
    test('should return 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service).toBe('booking-service');
      expect(res.body.data.status).toBe('healthy');
    });
  });

  describe('Authentication protection', () => {
    test('should reject POST /api/bookings without Authorization header', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          items: [
            { itemType: 'flight', itemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 },
          ],
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should reject GET /api/bookings without Authorization header', async () => {
      const res = await request(app).get('/api/bookings');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
