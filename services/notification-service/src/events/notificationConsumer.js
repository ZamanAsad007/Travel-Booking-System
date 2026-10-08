import { eventBus } from '../../../../shared/events/eventBus.js';
import { withIdempotency } from '../../../../shared/events/idempotency.js';
import { pool } from '../config/db.js';
import { notificationService } from '../services/notificationService.js';
import { EVENTS } from '../../../../shared/constants/events.js';

export async function startNotificationConsumer() {
  const queueName = 'notification-service.events';
  const routingKeys = [
    EVENTS.BOOKING_CONFIRMED,
    EVENTS.BOOKING_CANCELLED,
    EVENTS.PAYMENT_REFUNDED,
  ];

  const handleEvent = async (event) => {
    const { type, data } = event;
    console.log(`[notification-service] Processing notification event: ${type} for booking: ${data.bookingId}`);
    await notificationService.handleEventNotification(event);
  };

  try {
    await eventBus.subscribe(
      queueName,
      routingKeys,
      withIdempotency(pool, handleEvent),
      { withDlq: true, prefetch: 5 }
    );
    console.log('[notification-service] Notification event consumer started successfully with DLQ enabled.');
  } catch (err) {
    console.error('[notification-service] Failed to start notification event consumer:', err.message);
  }
}
