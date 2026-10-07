import { eventBus } from '../../../../shared/events/eventBus.js';
import { withIdempotency } from '../../../../shared/events/idempotency.js';
import { pool } from '../config/db.js';
import { paymentService } from '../services/paymentService.js';
import { EVENTS } from '../../../../shared/constants/events.js';

export async function startPaymentConsumer() {
  const queueName = 'payment-service.events';
  const routingKeys = [EVENTS.BOOKING_CREATED, EVENTS.BOOKING_CANCELLED];

  const handleEvent = async (event) => {
    const { type, data } = event;
    console.log(`[payment-service] Consumed saga event: ${type} for booking: ${data.bookingId}`);

    if (type === EVENTS.BOOKING_CREATED) {
      await paymentService.processPayment({
        bookingId: data.bookingId,
        amount: data.amount,
        userId: data.userId,
        items: data.items || [],
      });
    } else if (type === EVENTS.BOOKING_CANCELLED) {
      await paymentService.processRefund({
        bookingId: data.bookingId,
        amount: data.amount,
        userId: data.userId,
      });
    }
  };

  try {
    await eventBus.subscribe(queueName, routingKeys, withIdempotency(pool, handleEvent));
    console.log('[payment-service] Event consumer started successfully.');
  } catch (err) {
    console.error('[payment-service] Failed to start event consumer:', err.message);
  }
}
