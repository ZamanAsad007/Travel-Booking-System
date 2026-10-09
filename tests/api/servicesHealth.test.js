import request from 'supertest';
import { jest } from '@jest/globals';
import { pool as catalogPool } from '../../services/catalog-service/src/config/db.js';
import { pool as paymentPool } from '../../services/payment-service/src/config/db.js';
import catalogApp from '../../services/catalog-service/src/app.js';
import paymentApp from '../../services/payment-service/src/app.js';
import notificationApp from '../../services/notification-service/src/app.js';

describe('Microservices Health API Tests', () => {
  beforeAll(() => {
    jest
      .spyOn(catalogPool, 'query')
      .mockImplementation(async () => ({ rows: [{ '?column?': 1 }] }));
    jest
      .spyOn(paymentPool, 'query')
      .mockImplementation(async () => ({ rows: [{ '?column?': 1 }] }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  test('Catalog Service GET /health returns 200 and healthy', async () => {
    const res = await request(catalogApp).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('catalog-service');
  });

  test('Payment Service GET /health returns 200 and healthy', async () => {
    const res = await request(paymentApp).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('payment-service');
  });

  test('Notification Service GET /health returns 200 and healthy', async () => {
    const res = await request(notificationApp).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('notification-service');
  });
});
