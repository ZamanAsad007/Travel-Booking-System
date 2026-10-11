import { jest } from '@jest/globals';
import { outboxRepository } from '../../services/booking-service/src/repositories/outboxRepository.js';
import { processOutboxOnce } from '../../services/booking-service/src/events/outboxWorker.js';
import { eventBus } from '../../shared/events/eventBus.js';
import { EVENTS } from '../../shared/constants/events.js';

describe('Transactional Outbox Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should process and publish pending outbox events', async () => {
    const mockEvents = [
      {
        id: 'outbox-1',
        event_type: EVENTS.BOOKING_CREATED,
        payload: { bookingId: 'b-100', amount: 350 },
      },
      {
        id: 'outbox-2',
        event_type: EVENTS.BOOKING_CONFIRMED,
        payload: { bookingId: 'b-101', amount: 500 },
      },
    ];

    jest.spyOn(outboxRepository, 'getUnpublished').mockResolvedValue(mockEvents);
    const publishSpy = jest.spyOn(eventBus, 'publish').mockResolvedValue({ eventId: 'evt-test' });
    const markSpy = jest.spyOn(outboxRepository, 'markPublished').mockResolvedValue({ id: 'outbox-1' });

    const publishedCount = await processOutboxOnce(10);

    expect(publishedCount).toBe(2);
    expect(publishSpy).toHaveBeenCalledTimes(2);
    expect(publishSpy).toHaveBeenCalledWith(EVENTS.BOOKING_CREATED, { bookingId: 'b-100', amount: 350 });
    expect(publishSpy).toHaveBeenCalledWith(EVENTS.BOOKING_CONFIRMED, { bookingId: 'b-101', amount: 500 });
    expect(markSpy).toHaveBeenCalledWith('outbox-1');
    expect(markSpy).toHaveBeenCalledWith('outbox-2');
  });

  test('should stop and retry later if eventBus publish fails', async () => {
    const mockEvents = [
      {
        id: 'outbox-fail',
        event_type: EVENTS.BOOKING_CREATED,
        payload: { bookingId: 'b-999' },
      },
    ];

    jest.spyOn(outboxRepository, 'getUnpublished').mockResolvedValue(mockEvents);
    jest.spyOn(eventBus, 'publish').mockRejectedValue(new Error('Broker connection refused'));
    const markSpy = jest.spyOn(outboxRepository, 'markPublished');

    const publishedCount = await processOutboxOnce(10);

    expect(publishedCount).toBe(0);
    expect(markSpy).not.toHaveBeenCalled();
  });

  test('should return 0 when there are no pending outbox events', async () => {
    jest.spyOn(outboxRepository, 'getUnpublished').mockResolvedValue([]);
    const publishSpy = jest.spyOn(eventBus, 'publish');

    const publishedCount = await processOutboxOnce(10);

    expect(publishedCount).toBe(0);
    expect(publishSpy).not.toHaveBeenCalled();
  });
});
