import { jest } from '@jest/globals';
import { eventBus } from '../../shared/events/eventBus.js';
import { dlqStore } from '../../shared/events/dlqStore.js';

describe('EventBus Retry Policy & DLQ Unit Tests', () => {
  let mockChannel;

  beforeEach(() => {
    dlqStore.clear();
    mockChannel = {
      publish: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
    };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should retry failed message with exponential backoff and updated headers when retryCount < maxRetries', async () => {
    const msg = {
      content: Buffer.from(JSON.stringify({ eventId: 'evt-retry-1', type: 'test.event' })),
      properties: { headers: { 'x-retry-count': 1 } },
      fields: { routingKey: 'test.event' },
    };

    const event = { eventId: 'evt-retry-1', type: 'test.event' };
    const err = new Error('Database connection timeout');

    await eventBus.handleMessageFailure({
      channel: mockChannel,
      msg,
      queueName: 'test-queue',
      event,
      err,
      maxRetries: 3,
      initialDelayMs: 1000,
      backoffFactor: 2,
    });

    // Original message should be acked so the retry copy can take over
    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    expect(mockChannel.nack).not.toHaveBeenCalled();

    // Fast-forward delay (1000 * 2^1 = 2000ms)
    jest.advanceTimersByTime(2000);

    expect(mockChannel.publish).toHaveBeenCalledWith(
      expect.any(String),
      'test.event',
      msg.content,
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-retry-count': 2,
          'x-last-error': 'Database connection timeout',
        }),
      })
    );
  });

  it('should route message to DLQ and record failure when maxRetries is reached', async () => {
    const msg = {
      content: Buffer.from(JSON.stringify({ eventId: 'evt-dlq-1', type: 'booking.failed' })),
      properties: { headers: { 'x-retry-count': 3 } },
      fields: { routingKey: 'booking.failed' },
    };

    const event = { eventId: 'evt-dlq-1', type: 'booking.failed', data: { bookingId: 'b-999' } };
    const err = new Error('Fatal unrecoverable payload');

    await eventBus.handleMessageFailure({
      channel: mockChannel,
      msg,
      queueName: 'booking-queue',
      event,
      err,
      maxRetries: 3,
    });

    // Should nack with requeue=false to trigger dead-letter exchange
    expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false);
    expect(mockChannel.ack).not.toHaveBeenCalled();

    // DLQ store should have captured the message
    const failedMessages = eventBus.getFailedMessages('booking-queue');
    expect(failedMessages).toHaveLength(1);
    expect(failedMessages[0].id).toBe('evt-dlq-1');
    expect(failedMessages[0].error).toBe('Fatal unrecoverable payload');
    expect(failedMessages[0].retryCount).toBe(3);
  });

  it('should allow replaying failed messages from DLQ store', async () => {
    dlqStore.recordFailedMessage({
      queueName: 'payment-queue',
      event: { eventId: 'evt-replay-1', type: 'payment.retry', data: { amount: 100 } },
      error: 'Gateway timeout',
      routingKey: 'payment.retry',
    });

    const publishSpy = jest.spyOn(eventBus, 'publish').mockResolvedValue({ eventId: 'evt-replay-1' });

    const replayed = await eventBus.replayFailedMessage('evt-replay-1');
    expect(replayed.id).toBe('evt-replay-1');
    expect(publishSpy).toHaveBeenCalledWith('payment.retry', { amount: 100 }, 'evt-replay-1');

    // Message should be removed from DLQ store after replay
    expect(dlqStore.getMessageById('evt-replay-1')).toBeNull();
  });
});
