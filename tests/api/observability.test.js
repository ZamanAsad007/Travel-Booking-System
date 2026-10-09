import request from 'supertest';
import authApp from '../../services/auth-service/src/app.js';
import catalogApp from '../../services/catalog-service/src/app.js';
import bookingApp from '../../services/booking-service/src/app.js';
import paymentApp from '../../services/payment-service/src/app.js';
import notificationApp from '../../services/notification-service/src/app.js';

describe('Observability API Tests', () => {
  describe('Prometheus /metrics Endpoints', () => {
    test('auth-service exposes /metrics with Prometheus format', async () => {
      const res = await request(authApp).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http_request_duration_seconds');
      expect(res.text).toContain('service="auth-service"');
    });

    test('catalog-service exposes /metrics with Prometheus format', async () => {
      const res = await request(catalogApp).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http_request_duration_seconds');
      expect(res.text).toContain('service="catalog-service"');
    });

    test('booking-service exposes /metrics with Prometheus format', async () => {
      const res = await request(bookingApp).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http_request_duration_seconds');
      expect(res.text).toContain('service="booking-service"');
    });

    test('payment-service exposes /metrics with Prometheus format', async () => {
      const res = await request(paymentApp).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http_request_duration_seconds');
      expect(res.text).toContain('service="payment-service"');
    });

    test('notification-service exposes /metrics with Prometheus format', async () => {
      const res = await request(notificationApp).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http_request_duration_seconds');
      expect(res.text).toContain('service="notification-service"');
    });
  });

  describe('Correlation ID Tracking', () => {
    test('generates x-correlation-id header when not provided', async () => {
      const res = await request(authApp).get('/metrics');
      expect(res.headers['x-correlation-id']).toBeDefined();
      expect(res.headers['x-correlation-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    test('propagates existing x-correlation-id header', async () => {
      const testCorrelationId = 'test-trace-id-12345';
      const res = await request(authApp).get('/metrics').set('x-correlation-id', testCorrelationId);

      expect(res.headers['x-correlation-id']).toBe(testCorrelationId);
    });
  });
});
