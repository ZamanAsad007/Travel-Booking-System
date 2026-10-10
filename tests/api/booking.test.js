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

    test('should reject GET /api/bookings/admin/stats without admin role', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const userToken = jwt.sign(
        { id: 'u1', role: 'USER' },
        process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production'
      );
      const res = await request(app)
        .get('/api/bookings/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('should allow GET /api/bookings/admin/stats for admin user', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const adminToken = jwt.sign(
        { id: 'admin1', role: 'ADMIN' },
        process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production'
      );

      // Mock queries for stats
      bookingPool.query.mockImplementation(async (sql) => {
        if (typeof sql === 'string' && sql.includes('total_revenue')) {
          return {
            rows: [
              {
                total_bookings: 10,
                confirmed_bookings: 8,
                cancelled_bookings: 2,
                pending_bookings: 0,
                total_revenue: '5000.00',
              },
            ],
          };
        }
        return { rows: [] };
      });

      const res = await request(app)
        .get('/api/bookings/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBookings).toBe(10);
      expect(res.body.data.totalRevenue).toBe(5000);
    });

    test('should reject booking creation with invalid traveler details', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const userToken = jwt.sign(
        { id: 'u1', role: 'USER' },
        process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production'
      );
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            { itemType: 'flight', itemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 },
          ],
          travelers: [{ full_name: '', passport_no: '', date_of_birth: '' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should reject POST /api/bookings/coupons/validate without auth', async () => {
      const res = await request(app)
        .post('/api/bookings/coupons/validate')
        .send({ code: 'SAVE10', amount: 100 });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should validate coupon and calculate discount', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const userToken = jwt.sign(
        { id: 'u1', role: 'USER' },
        process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production'
      );

      bookingPool.query.mockImplementation(async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('FROM coupons WHERE UPPER(code)')) {
          return {
            rows: [
              {
                id: 'c1234567-0000-0000-0000-000000000001',
                code: 'SAVE10',
                discount_type: 'PERCENT',
                discount_value: '10.00',
                min_amount: '50.00',
                max_uses: 100,
                used_count: 5,
                active: true,
              },
            ],
          };
        }
        if (typeof sql === 'string' && sql.includes('FROM coupon_redemptions')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      const res = await request(app)
        .post('/api/bookings/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'SAVE10', amount: 200 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.discountAmount).toBe(20);
      expect(res.body.data.finalAmount).toBe(180);
    });

    test('should reject coupon validation if minimum amount is not met', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const userToken = jwt.sign(
        { id: 'u1', role: 'USER' },
        process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production'
      );

      bookingPool.query.mockImplementation(async (sql) => {
        if (typeof sql === 'string' && sql.includes('FROM coupons WHERE UPPER(code)')) {
          return {
            rows: [
              {
                id: 'c1',
                code: 'SAVE10',
                discount_type: 'PERCENT',
                discount_value: '10.00',
                min_amount: '100.00',
                active: true,
              },
            ],
          };
        }
        return { rows: [] };
      });

      const res = await request(app)
        .post('/api/bookings/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: 'SAVE10', amount: 50 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_COUPON');
    });

    test('should reject GET /api/bookings/admin/coupons for non-admin user', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const userToken = jwt.sign(
        { id: 'u1', role: 'USER' },
        process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production'
      );

      const res = await request(app)
        .get('/api/bookings/admin/coupons')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
