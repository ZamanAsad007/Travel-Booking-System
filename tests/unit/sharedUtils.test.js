import { jest } from '@jest/globals';
import { successResponse, errorResponse } from '../../shared/utils/response.js';
import { EVENTS, EXCHANGE_NAME } from '../../shared/constants/events.js';
import { BOOKING_STATUS } from '../../shared/constants/bookingStatus.js';

describe('Shared Utilities & Constants Unit Tests', () => {
  describe('Response helpers', () => {
    test('successResponse should format and send standard success json', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const payload = { flightId: 'flight-123', price: 299 };
      successResponse(mockRes, payload, 200);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: payload,
        error: null,
      });
    });

    test('errorResponse should format and send standard error json', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      errorResponse(mockRes, 'Item not found', 'NOT_FOUND', 404, { id: '123' });

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: {
          message: 'Item not found',
          code: 'NOT_FOUND',
          details: { id: '123' },
        },
      });
    });
  });

  describe('Event contracts', () => {
    test('should define all microservice saga event types', () => {
      expect(EVENTS.BOOKING_CREATED).toBe('booking.created');
      expect(EVENTS.PAYMENT_SUCCEEDED).toBe('payment.succeeded');
      expect(EVENTS.PAYMENT_FAILED).toBe('payment.failed');
      expect(EVENTS.BOOKING_CONFIRMED).toBe('booking.confirmed');
      expect(EVENTS.BOOKING_CANCELLED).toBe('booking.cancelled');
      expect(EVENTS.PAYMENT_REFUNDED).toBe('payment.refunded');
      expect(EXCHANGE_NAME).toBe('travel.events');
    });
  });

  describe('Booking status constants', () => {
    test('should match defined statuses in design doc', () => {
      expect(BOOKING_STATUS.PENDING).toBe('PENDING');
      expect(BOOKING_STATUS.CONFIRMED).toBe('CONFIRMED');
      expect(BOOKING_STATUS.CANCELLED).toBe('CANCELLED');
    });
  });
});
