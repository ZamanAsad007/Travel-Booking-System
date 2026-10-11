import { eventBus } from '../../../../shared/events/eventBus.js';
import { withIdempotency } from '../../../../shared/events/idempotency.js';
import { priceAlertService } from '../services/priceAlertService.js';
import { loyaltyService } from '../services/loyaltyService.js';
import { pool } from '../config/db.js';
import { EVENTS } from '../../../../shared/constants/events.js';

export async function startEngagementConsumer() {
  const queueName = 'engagement-service.events';
  const routingKeys = [
    EVENTS.BOOKING_CONFIRMED,
    EVENTS.BOOKING_CANCELLED,
    EVENTS.USER_REGISTERED,
    EVENTS.PRICE_CHANGED,
  ];

  const handleEvent = async (event) => {
    const { type, data } = event;
    console.log(`[engagement-service] Consumed event: ${type}`);

    if (type === EVENTS.BOOKING_CONFIRMED) {
      // Record completed trips for verified reviews
      if (data && data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          await pool.query(
            `INSERT INTO completed_trips (user_id, booking_id, item_type, item_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, booking_id, item_type, item_id) DO NOTHING`,
            [data.userId, data.bookingId, item.itemType, item.itemId]
          );
        }
      }

      // Award loyalty points
      await loyaltyService.handleBookingConfirmed(data);
    } else if (type === EVENTS.BOOKING_CANCELLED) {
      // Reverse loyalty points
      await loyaltyService.handleBookingCancelled(data);
    } else if (type === EVENTS.USER_REGISTERED) {
      // Setup loyalty account with welcome bonus
      await loyaltyService.handleUserRegistered(data);
    } else if (type === EVENTS.PRICE_CHANGED) {
      // Check active price alerts
      await priceAlertService.handlePriceChanged(data);
    }
  };

  try {
    await eventBus.subscribe(queueName, routingKeys, withIdempotency(pool, handleEvent));
    console.log('[engagement-service] Event consumer started successfully.');
  } catch (err) {
    console.error('[engagement-service] Failed to start event consumer:', err.message);
  }
}
