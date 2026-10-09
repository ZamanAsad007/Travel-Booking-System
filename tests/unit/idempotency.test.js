import { jest } from '@jest/globals';
import { withIdempotency } from '../../shared/events/idempotency.js';

describe('Idempotency Helper Unit Tests', () => {
  test('should execute handler and mark processed when event is new', async () => {
    const mockPool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // isEventProcessed -> false
        .mockResolvedValueOnce({ rows: [] }), // markEventProcessed
    };

    const handler = jest.fn().mockResolvedValue(true);
    const wrapped = withIdempotency(mockPool, handler);

    const event = { eventId: 'evt-unique-1', type: 'booking.created', data: {} };
    await wrapped(event);

    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(event);
  });

  test('should skip handler execution when event was already processed', async () => {
    const mockPool = {
      query: jest.fn().mockResolvedValueOnce({ rows: [{ event_id: 'evt-dup-1' }] }), // isEventProcessed -> true
    };

    const handler = jest.fn();
    const wrapped = withIdempotency(mockPool, handler);

    const event = { eventId: 'evt-dup-1', type: 'booking.created', data: {} };
    await wrapped(event);

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
  });

  test('should handle event without eventId gracefully', async () => {
    const mockPool = { query: jest.fn() };
    const handler = jest.fn().mockResolvedValue(true);
    const wrapped = withIdempotency(mockPool, handler);

    const event = { type: 'booking.created', data: {} };
    await wrapped(event);

    expect(handler).toHaveBeenCalledWith(event);
    expect(mockPool.query).not.toHaveBeenCalled();
  });
});
