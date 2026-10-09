import request from 'supertest';
import { jest } from '@jest/globals';
import { pool } from '../../services/auth-service/src/config/db.js';
import app from '../../services/auth-service/src/app.js';

describe('Auth Service API Tests', () => {
  beforeAll(() => {
    jest.spyOn(pool, 'query').mockImplementation(async () => ({ rows: [{ '?column?': 1 }] }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  describe('GET /health', () => {
    test('should return 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service).toBe('auth-service');
      expect(res.body.data.status).toBe('healthy');
    });
  });

  describe('POST /api/auth/register validation', () => {
    test('should reject registration with empty body', async () => {
      const res = await request(app).post('/api/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    test('should reject registration with invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'not-an-email',
        password: 'secretpassword',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login validation', () => {
    test('should reject login without password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Route 404 handler', () => {
    test('should return 404 on undefined routes', async () => {
      const res = await request(app).get('/api/auth/non-existent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
