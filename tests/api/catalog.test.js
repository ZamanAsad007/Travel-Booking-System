import request from 'supertest';
import app from '../../services/catalog-service/src/app.js';

describe('Catalog Service API Tests', () => {
  describe('POST /api/catalog/check-availability validation', () => {
    test('should reject request with missing fields', async () => {
      const res = await request(app).post('/api/catalog/check-availability').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    test('should reject request with invalid item UUID', async () => {
      const res = await request(app).post('/api/catalog/check-availability').send({
        itemType: 'flight',
        itemId: 'invalid-not-a-uuid',
        quantity: 1,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should reject request with invalid itemType', async () => {
      const res = await request(app).post('/api/catalog/check-availability').send({
        itemType: 'car',
        itemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        quantity: 1,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/catalog/holds validation', () => {
    test('should reject hold creation without bookingId', async () => {
      const res = await request(app).post('/api/catalog/holds').send({
        itemType: 'flight',
        itemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        quantity: 1,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Route 404 handler', () => {
    test('should return 404 on undefined routes', async () => {
      const res = await request(app).get('/api/catalog/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
