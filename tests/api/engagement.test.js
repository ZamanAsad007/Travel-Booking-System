import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { pool as engagementPool } from '../../services/engagement-service/src/config/db.js';
import { eventBus } from '../../shared/events/eventBus.js';
import engagementApp from '../../services/engagement-service/src/app.js';

describe('Engagement Service - Wishlist API Tests', () => {
  const testUser = {
    id: '11111111-2222-3333-4444-555555555555',
    email: 'user@travel.com',
    role: 'USER',
  };

  const token = jwt.sign(
    testUser,
    process.env.JWT_SECRET || 'travel_booking_super_secret_jwt_key_2026_change_in_production'
  );

  beforeAll(() => {
    jest.spyOn(eventBus, 'publish').mockImplementation(async () => ({ eventId: 'mock-evt-1' }));
    jest.spyOn(engagementPool, 'query').mockImplementation(async (sql, params) => {
      const queryStr = typeof sql === 'string' ? sql : sql.text;

      if (queryStr.includes('FROM wishlist')) {
        return {
          rows: [
            {
              id: 'w-1',
              user_id: testUser.id,
              item_type: 'flight',
              item_id: 'flight-123',
              created_at: new Date().toISOString(),
            },
          ],
          rowCount: 1,
        };
      }

      if (queryStr.includes('INSERT INTO wishlist')) {
        return {
          rows: [
            {
              id: 'w-new',
              user_id: testUser.id,
              item_type: params[1],
              item_id: params[2],
              created_at: new Date().toISOString(),
            },
          ],
          rowCount: 1,
        };
      }

      if (queryStr.includes('DELETE FROM wishlist')) {
        return { rows: [], rowCount: 1 };
      }

      if (queryStr.includes('FROM reviews') && queryStr.includes('COUNT(*)')) {
        return {
          rows: [{ total_reviews: 1, avg_rating: 4.8 }],
          rowCount: 1,
        };
      }

      if (queryStr.includes('FROM reviews') && queryStr.includes('SELECT id, user_id')) {
        return {
          rows: [
            {
              id: 'rev-1',
              user_id: testUser.id,
              user_name: 'Traveler',
              booking_id: 'b-123',
              item_type: 'flight',
              item_id: 'flight-123',
              rating: 5,
              comment: 'Great flight!',
              created_at: new Date().toISOString(),
            },
          ],
          rowCount: 1,
        };
      }

      if (queryStr.includes('FROM completed_trips')) {
        // If bookingId is 'b-valid', returns true
        if (params && params.includes('b-valid')) {
          return { rows: [{ id: 'ct-1' }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      if (queryStr.includes('SELECT id FROM reviews WHERE user_id')) {
        return { rows: [], rowCount: 0 };
      }

      if (queryStr.includes('INSERT INTO reviews')) {
        return {
          rows: [
            {
              id: 'rev-new',
              user_id: testUser.id,
              user_name: 'Traveler',
              booking_id: params[2],
              item_type: params[3],
              item_id: params[4],
              rating: params[5],
              comment: params[6],
              created_at: new Date().toISOString(),
            },
          ],
          rowCount: 1,
        };
      }

      return { rows: [], rowCount: 0 };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('GET /health returns healthy status', async () => {
    const res = await request(engagementApp).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('engagement-service');
  });

  test('GET /api/wishlist requires auth header', async () => {
    const res = await request(engagementApp).get('/api/wishlist');
    expect(res.status).toBe(401);
  });

  test('GET /api/wishlist returns wishlist items for authenticated user', async () => {
    const res = await request(engagementApp)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].item_id).toBe('flight-123');
  });

  test('POST /api/wishlist adds an item to wishlist', async () => {
    const res = await request(engagementApp)
      .post('/api/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemType: 'hotel',
        itemId: 'hotel-456',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.item_type).toBe('hotel');
    expect(res.body.data.item_id).toBe('hotel-456');
  });

  test('DELETE /api/wishlist removes an item from wishlist', async () => {
    const res = await request(engagementApp)
      .delete('/api/wishlist?itemType=flight&itemId=flight-123')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.removed).toBe(true);
  });

  describe('Reviews API Tests', () => {
    test('GET /api/reviews returns review stats and list', async () => {
      const res = await request(engagementApp).get(
        '/api/reviews?itemType=flight&itemId=flight-123'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.avgRating).toBe(4.8);
      expect(res.body.data.reviews.length).toBe(1);
    });

    test('POST /api/reviews rejects unverified traveler with 403', async () => {
      const res = await request(engagementApp)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingId: 'b-invalid',
          itemType: 'flight',
          itemId: 'flight-123',
          rating: 5,
          comment: 'Awesome',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNVERIFIED_TRAVELER');
    });

    test('POST /api/reviews allows verified traveler with completed trip', async () => {
      const res = await request(engagementApp)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingId: 'b-valid',
          itemType: 'flight',
          itemId: 'flight-123',
          rating: 5,
          comment: 'Confirmed awesome trip!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.item_id).toBe('flight-123');
    });
  });
});
