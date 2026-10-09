import { eventBus } from '../../../../shared/events/eventBus.js';
import { withIdempotency } from '../../../../shared/events/idempotency.js';
import { pool } from '../config/db.js';
import { catalogService } from '../services/catalogService.js';
import { EVENTS } from '../../../../shared/constants/events.js';

export async function startCatalogConsumer() {
  const queueName = 'catalog-service.events';
  const routingKeys = [EVENTS.BOOKING_CONFIRMED, EVENTS.BOOKING_CANCELLED];

  const handleEvent = async (event) => {
    const { type, data } = event;
    console.log(`[catalog-service] Handling event: ${type} for booking: ${data.bookingId}`);

    if (type === EVENTS.BOOKING_CONFIRMED) {
      // Convert held inventory into permanent reservations
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          await catalogService.confirmHoldToReservation({
            itemType: item.itemType,
            itemId: item.itemId,
            bookingId: data.bookingId,
            quantity: item.quantity,
            dateFrom: item.dateFrom,
            dateTo: item.dateTo,
          });
        }
      }
      console.log(`[catalog-service] Confirmed reservations for booking: ${data.bookingId}`);
    } else if (type === EVENTS.BOOKING_CANCELLED) {
      // Release holds and any created reservations
      await catalogService.releaseHolds(data.bookingId);
      console.log(
        `[catalog-service] Released holds and cancelled reservations for booking: ${data.bookingId}`
      );
    }
  };

  try {
    await eventBus.subscribe(queueName, routingKeys, withIdempotency(pool, handleEvent));
    console.log('[catalog-service] Event consumer started successfully.');
  } catch (err) {
    console.error('[catalog-service] Failed to start event consumer:', err.message);
  }
}
